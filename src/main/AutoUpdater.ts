import { app, dialog } from 'electron';
import * as path from 'node:path';
import * as fs from 'fs-extra';
import axios from 'axios';
import * as https from 'https';

interface PackageJson {
    version: string;
}

interface GitHubRelease {
    tag_name: string;
    assets: Array<{
        name: string;
        browser_download_url: string;
    }>;
}

export class AutoUpdater {
    private currentVersion: string;
    private updateUrl = 'https://raw.githubusercontent.com/bafv4/mcsr-portal/refs/heads/main/package.json';
    private releasesUrl = 'https://api.github.com/repos/bafv4/mcsr-portal/releases/latest';

    constructor() {
        this.currentVersion = app.getVersion();
    }

    async checkForUpdates(): Promise<boolean> {
        try {
            console.log('Checking for updates...');
            console.log('Current version:', this.currentVersion);

            // GitHubから最新のpackage.jsonを取得
            const response = await axios.get<PackageJson>(this.updateUrl, {
                timeout: 10000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

            const latestVersion = response.data.version;
            console.log('Latest version:', latestVersion);

            // バージョン比較
            if (this.isNewerVersion(latestVersion, this.currentVersion)) {
                console.log('New version available!');
                return true;
            }

            console.log('No updates available');
            return false;
        } catch (error) {
            console.error('Error checking for updates:', error);
            return false;
        }
    }

    async downloadUpdate(): Promise<string | null> {
        try {
            console.log('Downloading update...');

            // 最新のリリース情報を取得
            const response = await axios.get<GitHubRelease>(this.releasesUrl, {
                timeout: 30000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

            const release = response.data;
            const exeAsset = release.assets.find(asset => 
                asset.name.endsWith('.exe') && 
                asset.name.includes('portable')
            );

            if (!exeAsset) {
                throw new Error('No portable exe found in release');
            }

            // 現在のexeのパスを取得
            const currentExePath = app.getPath('exe');
            const downloadPath = path.join(path.dirname(currentExePath), `update-${exeAsset.name}`);

            console.log('Downloading to:', downloadPath);

            // ファイルをダウンロード
            const downloadResponse = await axios({
                method: 'GET',
                url: exeAsset.browser_download_url,
                responseType: 'stream',
                timeout: 300000, // 5分
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

            const writer = fs.createWriteStream(downloadPath);
            downloadResponse.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    console.log('Download completed');
                    resolve(downloadPath);
                });
                writer.on('error', reject);
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

            // 現在のexeをバックアップ
            await fs.copy(currentExePath, backupPath);

            // 新しいexeを現在の場所にコピー
            await fs.copy(downloadPath, currentExePath);

            // ダウンロードしたファイルを削除
            await fs.remove(downloadPath);

            // 新しいexeを実行
            const { spawn } = require('child_process');
            spawn(currentExePath, [], {
                detached: true,
                stdio: 'ignore'
            });

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
            const hasUpdate = await this.checkForUpdates();
            if (!hasUpdate) return;

            const result = await dialog.showMessageBox({
                type: 'info',
                title: 'アップデートが利用可能です',
                message: '新しいバージョンが利用可能です。ダウンロードしますか？',
                buttons: ['はい', 'いいえ'],
                defaultId: 0
            });

            if (result.response === 0) {
                const downloadPath = await this.downloadUpdate();
                if (downloadPath) {
                    await this.installUpdate(downloadPath);
                } else {
                    dialog.showErrorBox('エラー', 'アップデートのダウンロードに失敗しました。');
                }
            }
        } catch (error) {
            console.error('Update error:', error);
            dialog.showErrorBox('エラー', 'アップデート中にエラーが発生しました。');
        }
    }
} 