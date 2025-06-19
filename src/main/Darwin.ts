import axios from 'axios';
import path from 'node:path';
import sudo from 'sudo-prompt';
import extract from "extract-zip"
import * as fs from 'fs';
import { download } from 'electron-dl';
import { BrowserWindow, ipcMain } from 'electron';
import { URL } from "url";
import type { Option } from '../env';

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
                const item = await download(win, op.url, {
                    directory: dir,
                    onProgress: (progress) => {
                        const current: number = Math.round((progress.totalBytes * progress.percent + downloadedBytes) * 100 / totalBytes);
                        tick(1, current, '');
                    },
                });
                downloadedBytes += item.getTotalBytes();
            }

        } catch (err) {
            win.webContents.send('darwin-err', 1, err);
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
    console.log(urls);
    const sizes = await Promise.all(
        urls.map(async (url) => {
            const res = await axios.head(url);
            const len = res.headers['content-length'];
            return len ? parseInt(len, 10) : 0;
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
                console.log('Installer finished successfully.');
                fs.unlinkSync(exePath);
                resolve();
            }
        });
    });
};