import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'node:path';
import { URL } from "url";
import { calcSize, extractZip, runInstaller } from './Darwin';
import type { Option } from '../env';
import { download } from 'electron-dl';

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 640,
        minHeight: 480,
        title: `MCSR Portal`,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            sandbox: false,
            webSecurity: true,
            nodeIntegration: true,
        },
    });

    const isDev = !app.isPackaged;
    if (isDev) {
        win.loadURL('http://localhost:5173');
    } else {
        win.loadFile(path.join(__dirname, '../dist-app/index.html'));
    }
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// フォルダ選択用
ipcMain.handle('select-dest', async () => {
    const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
        properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
});

// download
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

const sleep = (time: number) => new Promise((r) => setTimeout(r, time));