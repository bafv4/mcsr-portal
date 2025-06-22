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

export class AutoUpdater {
    private currentVersion: string;
    private releasesUrl = 'https://api.github.com/repos/bafv4/mcsr-portal/releases/latest';

    constructor() {
        this.currentVersion = app.getVersion();
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
            
            const updateInfo = await this.checkForUpdates();
            if (!updateInfo.hasUpdate) {
                console.log('No updates available');
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