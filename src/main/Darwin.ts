import path from 'node:path';
import sudo from 'sudo-prompt';
import extract from "extract-zip"
import * as fs from 'fs';
import { BrowserWindow, ipcMain } from 'electron';
import { URL } from "url";
import type { Option } from '../env';
import got, { type Progress } from 'got';
import { pipeline } from 'node:stream/promises';

export const darwinHandler = () => {
    ipcMain.handle('start-download', async (_e, options: Option[], dir: string) => {
        const win = BrowserWindow.getAllWindows()[0];;
        if (!win) return;

        let totalBytes: number = 0;
        let downloadedBytes: number = 0;

        const tick = (state: number, prog: number, target: string) => {
            win.webContents.send('tick', state, prog, target);
        }

        await sleep(500);

        const getFullPath = (url: string): string => {
            const fileName = path.basename(new URL(url).pathname);
            return path.join(dir, fileName);
        }

        const optWithFullpath = options.map(op => ({
            ...op,
            fullPath: getFullPath(op.url)
        }));

        /** zips */
        const zips = optWithFullpath.filter(op => op.tag == "zip");
        /** installers */
        const installers = optWithFullpath.filter(op => op.tag == "installer");

        win.webContents.send('total-files', zips.length, installers.length);

        // calc sum of all file size
        try {
            totalBytes = await calcSize(options.map(op => op.url));
        } catch (err: any) {
            win.webContents.send('darwin-err', 0, err);
        }

        tick(1, 0, '');

        try {
            for (const op of options) {
                const downloadStream = got.stream(op.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                        'Connection': 'keep-alive',
                        'Referer': 'https://www.autohotkey.com/'
                    }
                });

                downloadStream.on('downloadProgress', (progress: Progress) => {
                    if (progress.total) {
                        const currentTotalProgress = downloadedBytes + progress.transferred;
                        const currentPercent = Math.round((currentTotalProgress / totalBytes) * 100);
                        tick(1, currentPercent, '');
                    }
                });
                
                const fullPath = getFullPath(op.url);
                const writer = fs.createWriteStream(fullPath);

                await pipeline(downloadStream, writer);

                const stats = fs.statSync(fullPath);
                downloadedBytes += stats.size;
            }

        } catch (err: any) {
            win.webContents.send('darwin-err', 1, err.message || 'An unknown download error occurred');
        }

        if (zips) {
            tick(2, 0, '');
            await sleep(500);
            // state => unzip
            for (const [index, zip] of zips.entries()) {
                tick(2, index, zip.name);
                await extractZip(zip.fullPath).catch((err) => {
                    win.webContents.send('darwin-err', 2, err);
                });
                tick(2, index + 1, zip.name);
            }
            tick(2, zips.length, '');
        }

        // state => installing
        if (installers) {
            tick(3, 0, '');
            await sleep(3500);
            for (const [index, ins] of installers.entries()) {
                tick(3, index, ins.name);
                await runInstaller(ins.fullPath).catch((err) => {
                    win.webContents.send('darwin-err', 2, err);
                });
            }
            tick(3, installers.length, '');
        }

        // state => finish
        tick(4, 0, '');
    });
}

const sleep = (time: number) => new Promise((r) => setTimeout(r, time));

export const calcSize = async (urls: string[]) => {
    const sizes = await Promise.all(
        urls.map(async (url) => {
            try {
                const res = await got.head(url);
                const len = res.headers['content-length'];
                return len ? parseInt(len, 10) : 0;
            } catch (error) {
                return 0; // Return 0 if size cannot be determined
            }
        })
    );
    return sizes.reduce((acc, size) => acc + size, 0);
};

export const extractZip = async (zipPath: string): Promise<void> => {
    await extract(zipPath, { dir: path.dirname(zipPath) });
    fs.unlinkSync(zipPath);
};

export const runInstaller = (exePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const command = `"${path.resolve(exePath)}"`;
        const options = {
            name: 'MCSR Starter App Installer',
        };

        sudo.exec(command, options, (error, _stdout, _stderr) => {
            if (error) {
                reject(error);
            } else {
                fs.unlinkSync(exePath);
                resolve();
            }
        });
    });
};