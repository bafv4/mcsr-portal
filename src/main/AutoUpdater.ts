import { app, dialog } from 'electron';
import * as path from 'node:path';
import * as fs from 'fs-extra';
import axios from 'axios';

interface GitHubRelease {
    tag_name: string;
    name: string;
    body: string;
    assets: Array<{
        name: string;
        browser_download_url: string;
        size: number;
    }>;
}

// 翻訳用のユーティリティ関数
async function translateText(text: string): Promise<string> {
    try {
        const encodedText = encodeURIComponent(text);
        const response = await axios.get<{code: number, text: string}>(`https://script.google.com/macros/s/AKfycbw7n2mKWLhQvf_eYkmzrvcCWxxi7KLhiMZKiH2b2n-24Jb77YjDHPJMsCHiAYbgbpM1/exec?text=${encodedText}&source=en&target=ja`);
        if (response.data && response.data.code === 200 && response.data.text) {
            return response.data.text;
        }
        return text; // Return original text on failure
    } catch (error) {
        return text; // Return original text on error
    }
}

// package.jsonからバージョンを取得する関数
function getAppVersion(): string {
    try {
        // 開発環境とパッケージ環境でパスが異なる
        const packagePath = app.isPackaged 
            ? path.join(process.resourcesPath, 'app.asar.unpacked', 'package.json')
            : path.join(__dirname, '..', '..', 'package.json');
        
        if (fs.existsSync(packagePath)) {
            const packageJson = fs.readJsonSync(packagePath);
            return packageJson.version;
        }
        
        // フォールバック: 相対パスでpackage.jsonを探す
        const fallbackPaths = [
            path.join(__dirname, '..', '..', 'package.json'),
            path.join(__dirname, '..', 'package.json'),
            path.join(__dirname, 'package.json'),
            path.join(process.cwd(), 'package.json')
        ];
        
        for (const fallbackPath of fallbackPaths) {
            if (fs.existsSync(fallbackPath)) {
                const packageJson = fs.readJsonSync(fallbackPath);
                return packageJson.version;
            }
        }
        
        // 最後のフォールバック: app.getVersion()
        console.warn('Could not find package.json, falling back to app.getVersion()');
        return app.getVersion();
    } catch (error) {
        console.error('Error reading package.json:', error);
        return app.getVersion();
    }
}

export class AutoUpdater {
    private currentVersion: string;
    private releasesUrl = 'https://api.github.com/repos/bafv4/mcsr-portal/releases/latest';

    constructor() {
        this.currentVersion = getAppVersion();
        console.log('AutoUpdater initialized with version:', this.currentVersion);
    }

    // テスト用メソッド：モックデータでテスト
    async testUpdateFlow(): Promise<void> {
        console.log('=== Testing Update Flow ===');
        console.log('Current version:', this.currentVersion);
        console.log('Development mode:', !app.isPackaged);
        
        // モックのリリース情報を作成
        const mockRelease: GitHubRelease = {
            tag_name: 'v0.1.1',
            name: 'Test Release',
            body: 'This is a test release for testing the update functionality.',
            assets: [
                {
                    name: 'mcsr-portal-v0.1.1.exe',
                    browser_download_url: 'https://example.com/test.exe',
                    size: 1024 * 1024 // 1MB
                }
            ]
        };

        // バージョン比較テスト
        console.log('Testing version comparison...');
        const isNewer = this.isNewerVersion('0.1.1', this.currentVersion);
        console.log(`Is 0.1.1 newer than ${this.currentVersion}? ${isNewer}`);

        // 翻訳機能テスト
        console.log('Testing translation...');
        const translatedTitle = await translateText('Update Available');
        console.log(`Translated title: ${translatedTitle}`);

        // 開発環境では実際のダウンロードは行わない
        if (!app.isPackaged) {
            console.log('Development mode: Skipping actual download test');
            console.log('Testing dialog display (simulation only)...');
            
            const title = await translateText('Test Mode');
            const message = await translateText('This is a test dialog in development mode.');
            const okButton = await translateText('OK');
            
            const result = await dialog.showMessageBox({
                type: 'info',
                title: title,
                message: message,
                detail: 'In development mode, actual updates are disabled for safety.',
                buttons: [okButton],
                defaultId: 0
            });
            
            console.log(`Test dialog response: OK`);
        } else {
            // パッケージ環境でのみ実際のダイアログテスト
            console.log('Testing dialog display...');
            const title = await translateText('Update Available');
            const message = await translateText(`A new version (0.1.1) is available. Would you like to download it?`);
            const yesButton = await translateText('Yes');
            const noButton = await translateText('No');

            const result = await dialog.showMessageBox({
                type: 'info',
                title: title,
                message: message,
                detail: mockRelease.body,
                buttons: [yesButton, noButton],
                defaultId: 0
            });

            console.log(`User response: ${result.response === 0 ? 'Yes' : 'No'}`);
        }
        
        console.log('=== Test Complete ===');
    }

    // テスト用メソッド：実際のGitHub APIをテスト
    async testGitHubAPI(): Promise<void> {
        console.log('=== Testing GitHub API ===');
        console.log('API URL:', this.releasesUrl);
        
        try {
            const response = await axios.get<GitHubRelease>(this.releasesUrl, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'MCSR-Portal-Updater'
                }
            });

            console.log('GitHub API response successful');
            console.log('Status code:', response.status);
            console.log('Latest release:', response.data.tag_name);
            console.log('Release name:', response.data.name);
            console.log('Assets count:', response.data.assets.length);
            
            // 適切なexeアセットがあるかチェック
            const exeAsset = response.data.assets.find(asset => 
                asset.name.endsWith('.exe') && 
                asset.name.startsWith('mcsr-portal-')
            );
            
            if (exeAsset) {
                console.log('Found suitable exe asset:', exeAsset.name);
                console.log('Asset size:', exeAsset.size, 'bytes');
                console.log('Download URL:', exeAsset.browser_download_url);
            } else {
                console.log('No suitable exe asset found');
                console.log('Available assets:');
                response.data.assets.forEach(asset => {
                    console.log(`  - ${asset.name} (${asset.size} bytes)`);
                });
            }
            
        } catch (error: any) {
            console.error('GitHub API test failed:');
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Headers:', error.response.headers);
                console.error('Data:', error.response.data);
            } else if (error.request) {
                console.error('Request error:', error.request);
            } else {
                console.error('Error message:', error.message);
            }
        }
        
        console.log('=== GitHub API Test Complete ===');
    }

    async checkForUpdates(): Promise<{ hasUpdate: boolean; latestVersion?: string; releaseInfo?: GitHubRelease }> {
        try {
            console.log('Checking for updates...');
            console.log('Current version:', this.currentVersion);

            // GitHubから最新のリリース情報を取得
            const response = await axios.get<GitHubRelease>(this.releasesUrl, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'MCSR-Portal-Updater'
                }
            });

            const release = response.data;
            const latestVersion = release.tag_name.replace('v', ''); // v1.0.0 -> 1.0.0

            console.log('Latest version:', latestVersion);

            // バージョン比較
            if (this.isNewerVersion(latestVersion, this.currentVersion)) {
                console.log('New version available');
                return { 
                    hasUpdate: true, 
                    latestVersion: latestVersion,
                    releaseInfo: release
                };
            }

            console.log('No updates available');
            return { hasUpdate: false };
        } catch (error) {
            console.error('Error checking for updates:', error);
            return { hasUpdate: false };
        }
    }

    async downloadUpdate(releaseInfo: GitHubRelease): Promise<string | null> {
        try {
            console.log('Starting download...');

            // 開発環境では更新を無効化
            if (!app.isPackaged) {
                console.log('Development mode detected. Update download is disabled.');
                console.log('In development mode, updates should be handled manually.');
                throw new Error('Update download is disabled in development mode');
            }

            // Windows用のexeアセットを探す
            const exeAsset = releaseInfo.assets.find(asset => 
                asset.name.endsWith('.exe') && 
                asset.name.startsWith('mcsr-portal-')
            );

            if (!exeAsset) {
                console.error('No suitable exe asset found');
                throw new Error('No suitable exe asset found in release');
            }

            console.log('Found asset:', exeAsset.name);

            // ダウンロード先のパスを設定
            const currentExePath = app.getPath('exe');
            const downloadDir = path.dirname(currentExePath);
            const downloadPath = path.join(downloadDir, `update-${exeAsset.name}`);

            console.log('Downloading to:', downloadPath);

            // ファイルをダウンロード
            const downloadResponse = await axios({
                method: 'GET',
                url: exeAsset.browser_download_url,
                responseType: 'stream',
                timeout: 300000, // 5分
                headers: {
                    'User-Agent': 'MCSR-Portal-Updater'
                }
            });

            const writer = fs.createWriteStream(downloadPath);
            downloadResponse.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    console.log('Download completed');
                    resolve(downloadPath);
                });
                writer.on('error', (error) => {
                    console.error('Download error:', error);
                    reject(error);
                });
            });

        } catch (error) {
            console.error('Error downloading update:', error);
            return null;
        }
    }

    async installUpdate(downloadPath: string): Promise<boolean> {
        try {
            console.log('Installing update...');
            
            // 開発環境では更新を無効化
            if (!app.isPackaged) {
                console.log('Development mode detected. Update installation is disabled.');
                console.log('In development mode, updates should be handled manually.');
                throw new Error('Update installation is disabled in development mode');
            }
            
            const currentExePath = app.getPath('exe');
            const backupPath = currentExePath + '.backup';

            console.log('Creating backup at:', backupPath);

            // 現在のexeをバックアップ
            await fs.copy(currentExePath, backupPath);

            console.log('Copying new exe...');

            // 新しいexeを現在の場所にコピー
            await fs.copy(downloadPath, currentExePath);

            console.log('Removing download file...');

            // ダウンロードしたファイルを削除
            await fs.remove(downloadPath);

            console.log('Starting new version...');

            // 新しいexeを実行
            const { spawn } = require('child_process');
            spawn(currentExePath, [], {
                detached: true,
                stdio: 'ignore'
            });

            console.log('Quitting current app...');

            // 現在のアプリを終了
            app.quit();

            return true;
        } catch (error) {
            console.error('Error installing update:', error);
            return false;
        }
    }

    private isNewerVersion(latest: string, current: string): boolean {
        const latestParts = latest.split('.').map(Number);
        const currentParts = current.split('.').map(Number);

        for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
            const latestPart = latestParts[i] || 0;
            const currentPart = currentParts[i] || 0;

            if (latestPart > currentPart) return true;
            if (latestPart < currentPart) return false;
        }

        return false;
    }

    async performUpdate(): Promise<void> {
        try {
            console.log('Starting update process...');
            
            // 開発環境での警告
            if (!app.isPackaged) {
                console.log('Development mode detected. Update process will be limited.');
                console.log('Only update checking and testing will be available.');
            }
            
            const updateInfo = await this.checkForUpdates();
            if (!updateInfo.hasUpdate) {
                console.log('No updates available');
                return;
            }

            // 開発環境では更新実行を制限
            if (!app.isPackaged) {
                const title = await translateText('Development Mode');
                const message = await translateText('Update is available but cannot be installed in development mode.');
                const detail = await translateText('Please build and package the application to test the full update process.');
                const okButton = await translateText('OK');
                
                await dialog.showMessageBox({
                    type: 'info',
                    title: title,
                    message: message,
                    detail: detail,
                    buttons: [okButton]
                });
                return;
            }

            // 多言語対応のメッセージ
            const title = await translateText('Update Available');
            const message = await translateText(`A new version (${updateInfo.latestVersion}) is available. Would you like to download it?`);
            const yesButton = await translateText('Yes');
            const noButton = await translateText('No');

            const result = await dialog.showMessageBox({
                type: 'info',
                title: title,
                message: message,
                detail: updateInfo.releaseInfo?.body || '',
                buttons: [yesButton, noButton],
                defaultId: 0
            });

            if (result.response === 0) {
                console.log('User chose to download update');
                
                const downloadPath = await this.downloadUpdate(updateInfo.releaseInfo!);
                if (downloadPath) {
                    console.log('Download successful, installing...');
                    await this.installUpdate(downloadPath);
                } else {
                    console.error('Download failed');
                    const errorTitle = await translateText('Error');
                    const errorMessage = await translateText('Failed to download the update.');
                    dialog.showErrorBox(errorTitle, errorMessage);
                }
            } else {
                console.log('User chose not to download update');
            }
        } catch (error) {
            console.error('Error during update process:', error);
            const errorTitle = await translateText('Error');
            const errorMessage = await translateText('An error occurred during the update.');
            dialog.showErrorBox(errorTitle, errorMessage);
        }
    }
}