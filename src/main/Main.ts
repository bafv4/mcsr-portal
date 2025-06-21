import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { darwinHandler } from './Darwin';

function renderTemplate(template: string, vars: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
        vars[key] !== undefined ? String(vars[key]) : ''
    );
}

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

    darwinHandler();

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

// Prism Launcherのインストール確認
ipcMain.handle('check-prism-launcher', async () => {
    const possiblePaths = [
        path.join(process.env.APPDATA || '', 'PrismLauncher'),
        path.join(process.env.LOCALAPPDATA || '', 'PrismLauncher'),
        path.join(process.env.APPDATA || '', 'MultiMC'),
        path.join(process.env.LOCALAPPDATA || '', 'MultiMC')
    ];

    for (const launcherPath of possiblePaths) {
        if (fs.existsSync(launcherPath)) {
            return launcherPath;
        }
    }
    return null;
});

// インスタンス作成
ipcMain.handle('create-instance', async (_event, instanceData: any) => {
    try {
        const { launcherRoot, instanceName, memoryMin, memoryMax, useFabric, fabricVersion, javaArgs } = instanceData;
        
        // インスタンスディレクトリの作成
        const instanceDir = path.join(launcherRoot, 'instances', instanceName);
        if (!fs.existsSync(instanceDir)) {
            fs.mkdirSync(instanceDir, { recursive: true });
        }

        // テンプレート読み込み
        const cfgTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'instance.cfg.template'), 'utf-8');
        const mmcPackTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'mmc-pack.json.template'), 'utf-8');

        // instance.cfg生成
        const instanceConfig = renderTemplate(cfgTemplate, {
            instanceName,
            javaArgs,
            memoryMin,
            memoryMax
        });
        fs.writeFileSync(path.join(instanceDir, 'instance.cfg'), instanceConfig);

        // mmc-pack.json生成
        let mmcPackStr = renderTemplate(mmcPackTemplate, {
            useFabric: useFabric ? 'true' : '',
            fabricVersion
        });
        // useFabricがfalseの場合、Fabric Loader部分を除去
        if (!useFabric) {
            mmcPackStr = mmcPackStr.replace(/,?\{\{#useFabric}}[\s\S]*?\{\{\/useFabric}}/g, '');
        } else {
            mmcPackStr = mmcPackStr.replace(/\{\{#useFabric}}|\{\{\/useFabric}}/g, '');
        }
        fs.writeFileSync(path.join(instanceDir, 'mmc-pack.json'), mmcPackStr);

        return { success: true };
    } catch (error: any) {
        console.error('Instance creation error:', error);
        return { success: false, error: error.message };
    }
});

// ディレクトリ作成用
ipcMain.handle('create-directory', async (_event, dirPath: string) => {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return { success: true };
    } catch (error: any) {
        console.error('Directory creation error:', error);
        return { success: false, error: error.message };
    }
});