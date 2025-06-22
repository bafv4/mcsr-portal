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
    private updateUrl = 'https://raw.githubusercontent.com/bafv4/mcsr-portal/refs/heads/main/package.json';
    private releasesUrl = 'https://api.github.com/repos/bafv4/mcsr-portal/releases/latest';

    constructor() {
        this.currentVersion = app.getVersion();
    }

    async checkForUpdates(): Promise<boolean> {
        try {
            // GitHubから最新のpackage.jsonを取得
            const response = await axios.get<PackageJson>(this.updateUrl, {
                timeout: 10000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

            const latestVersion = response.data.version;

            // バージョン比較
            if (this.isNewerVersion(latestVersion, this.currentVersion)) {
                return true;
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    async downloadUpdate(): Promise<string | null> {
        try {
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
                    resolve(downloadPath);
                });
                writer.on('error', reject);
            });

        } catch (error) {
            return null;
        }
    }

    async installUpdate(downloadPath: string): Promise<boolean> {
        try {
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

            // 多言語対応のメッセージ
            const title = await translateText('Update Available');
            const message = await translateText('A new version is available. Would you like to download it?');
            const yesButton = await translateText('Yes');
            const noButton = await translateText('No');

            const result = await dialog.showMessageBox({
                type: 'info',
                title: title,
                message: message,
                buttons: [yesButton, noButton],
                defaultId: 0
            });

            if (result.response === 0) {
                const downloadPath = await this.downloadUpdate();
                if (downloadPath) {
                    await this.installUpdate(downloadPath);
                } else {
                    const errorTitle = await translateText('Error');
                    const errorMessage = await translateText('Failed to download the update.');
                    dialog.showErrorBox(errorTitle, errorMessage);
                }
            }
        } catch (error) {
            const errorTitle = await translateText('Error');
            const errorMessage = await translateText('An error occurred during the update.');
            dialog.showErrorBox(errorTitle, errorMessage);
        }
    }
} 