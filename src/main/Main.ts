import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import * as fs from 'node:fs';
import { darwinHandler } from './Darwin';
import { AutoUpdater } from './AutoUpdater';
import axios from 'axios';

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
        // パッケージ時はメニューバーを完全に無効化
        ...(app.isPackaged && { 
            autoHideMenuBar: true,
            menuBarVisible: false
        }),
        webPreferences: {
            preload: path.join(__dirname, 'Preload.js'),
            contextIsolation: true,
            sandbox: false,
            webSecurity: true,
            nodeIntegration: true,
            // パッケージ時はDevToolsを無効化
            devTools: app.isPackaged ? false : true,
        },
    });

    // 開発時のみDevToolsを開く
    if (!app.isPackaged) {
        // win.webContents.openDevTools();
    } else {
        // パッケージ時はDevToolsを開くキーボードショートカットを無効化
        win.webContents.on('before-input-event', (event, input) => {
            // F12キーを無効化
            if (input.key === 'F12') {
                event.preventDefault();
            }
            // Ctrl+Shift+I (DevTools)を無効化
            if (input.control && input.shift && input.key === 'I') {
                event.preventDefault();
            }
            // Ctrl+Shift+C (DevTools)を無効化
            if (input.control && input.shift && input.key === 'C') {
                event.preventDefault();
            }
        });

        // パッケージ時は右クリックメニューを無効化
        win.webContents.on('context-menu', (event) => {
            event.preventDefault();
        });
    }

    darwinHandler();

    const isDev = !app.isPackaged;
    if (isDev) {
        win.loadURL('http://localhost:5173');
    } else {
        win.loadFile(path.join(__dirname, '../app/index.html'));
    }
};

app.on('ready', async () => {
    createWindow();
    
    // 自動アップデートチェック（本番環境のみ）
    if (!app.isPackaged) {
        return;
    }
    
    try {
        const updater = new AutoUpdater();
        await updater.performUpdate();
    } catch (error) {
        // エラーログは開発時のみ
    }
});

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

// Java実行ファイル選択用
ipcMain.handle('select-java-executable', async () => {
    const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
        properties: ['openFile'],
        filters: [
            { name: 'Java Executable', extensions: ['exe'] },
            { name: 'All Files', extensions: ['*'] }
        ]
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
        const { launcherRoot, instanceName, memoryMin, memoryMax, useFabric, fabricVersion, javaArgs, javaPath } = instanceData;
        
        // インスタンスディレクトリの作成
        const instanceDir = path.join(launcherRoot, 'instances', instanceName);
        if (!fs.existsSync(instanceDir)) {
            fs.mkdirSync(instanceDir, { recursive: true });
        }

        // ランチャーの種類を検出
        const isPrismLauncher = launcherRoot.toLowerCase().includes('prismlauncher');
        const templateFileName = isPrismLauncher ? 'instance.cfg.prism.template' : 'instance.cfg.template';

        // テンプレート読み込み
        const cfgTemplate = fs.readFileSync(path.join(__dirname, 'templates', templateFileName), 'utf-8');
        const mmcPackTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'mmc-pack.json.template'), 'utf-8');

        // instance.cfg生成
        const instanceConfig = renderTemplate(cfgTemplate, {
            instanceName,
            javaArgs,
            memoryMin,
            memoryMax,
            JavaPath: javaPath
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
        return { success: false, error: error.message };
    }
});

// 自動アップデートチェック
ipcMain.handle('check-for-updates', async () => {
    try {
        const updater = new AutoUpdater();
        const hasUpdate = await updater.checkForUpdates();
        return { success: true, hasUpdate };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

// 手動アップデート実行
ipcMain.handle('perform-update', async () => {
    try {
        const updater = new AutoUpdater();
        await updater.performUpdate();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('translate', async (_event, text: string) => {
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
});