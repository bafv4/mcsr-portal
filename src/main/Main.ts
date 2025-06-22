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
        
        // 開発時のみメニューバーを表示
        win.setMenuBarVisibility(true);
        
        // 開発用メニューを作成
        const { Menu } = require('electron');
        const template = [
            {
                label: '開発',
                submenu: [
                    {
                        label: 'DevToolsを開く',
                        accelerator: 'F12',
                        click: () => {
                            win.webContents.openDevTools();
                        }
                    },
                    {
                        label: 'AutoUpdaterテスト実行',
                        accelerator: 'Ctrl+Shift+T',
                        click: async () => {
                            console.log('Running AutoUpdater tests from menu...');
                            const updater = new AutoUpdater();
                            
                            try {
                                // テストフロー実行
                                console.log('\n--- Testing Update Flow ---');
                                await updater.testUpdateFlow();
                                
                                // GitHub APIテスト
                                console.log('\n--- Testing GitHub API ---');
                                await updater.testGitHubAPI();
                                
                                // 実際の更新チェック
                                console.log('\n--- Testing Real Update Check ---');
                                const updateInfo = await updater.checkForUpdates();
                                console.log('Update check result:', updateInfo);
                                
                                console.log('\n=== All tests completed ===');
                                
                                // テスト完了をユーザーに通知
                                dialog.showMessageBox(win, {
                                    type: 'info',
                                    title: 'テスト完了',
                                    message: 'AutoUpdaterテストが完了しました。\nコンソールログを確認してください。'
                                });
                            } catch (error) {
                                console.error('Test execution failed:', error);
                                dialog.showErrorBox('テストエラー', `テスト実行中にエラーが発生しました: ${error}`);
                            }
                        }
                    },
                    {
                        label: '個別テスト',
                        submenu: [
                            {
                                label: '更新フローテスト',
                                click: async () => {
                                    const updater = new AutoUpdater();
                                    await updater.testUpdateFlow();
                                    dialog.showMessageBox(win, {
                                        type: 'info',
                                        title: 'テスト完了',
                                        message: '更新フローテストが完了しました。'
                                    });
                                }
                            },
                            {
                                label: 'GitHub APIテスト',
                                click: async () => {
                                    const updater = new AutoUpdater();
                                    await updater.testGitHubAPI();
                                    dialog.showMessageBox(win, {
                                        type: 'info',
                                        title: 'テスト完了',
                                        message: 'GitHub APIテストが完了しました。'
                                    });
                                }
                            },
                            {
                                label: '更新チェックテスト',
                                click: async () => {
                                    const updater = new AutoUpdater();
                                    const result = await updater.checkForUpdates();
                                    dialog.showMessageBox(win, {
                                        type: 'info',
                                        title: '更新チェック結果',
                                        message: `更新チェックが完了しました。\n更新の有無: ${result.hasUpdate ? 'あり' : 'なし'}\n最新バージョン: ${result.latestVersion || '不明'}`
                                    });
                                }
                            }
                        ]
                    }
                ]
            }
        ];
        
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
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
    
    // 開発環境でのみテスト機能を有効化
    if (!app.isPackaged) {
        console.log('=== Development Mode: AutoUpdater Tests Available ===');
        console.log('Press Ctrl+Shift+T to run AutoUpdater tests');
        
        // キーボードショートカットでテスト実行
        const { globalShortcut } = require('electron');
        globalShortcut.register('CommandOrControl+Shift+T', async () => {
            console.log('Running AutoUpdater tests...');
            const updater = new AutoUpdater();
            
            try {
                // テストフロー実行
                console.log('\n--- Testing Update Flow ---');
                await updater.testUpdateFlow();
                
                // GitHub APIテスト
                console.log('\n--- Testing GitHub API ---');
                await updater.testGitHubAPI();
                
                // 実際の更新チェック
                console.log('\n--- Testing Real Update Check ---');
                const updateInfo = await updater.checkForUpdates();
                console.log('Update check result:', updateInfo);
                
                console.log('\n=== All tests completed ===');
            } catch (error) {
                console.error('Test execution failed:', error);
            }
        });
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // グローバルショートカットの登録解除
        if (!app.isPackaged) {
            const { globalShortcut } = require('electron');
            globalShortcut.unregisterAll();
        }
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
        const { launcherRoot, instanceName, memoryMin, memoryMax, useFabric, fabricVersion, javaArgs, javaPath, selectedGroup, newGroupName } = instanceData;
        
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

        // グループに追加
        if (selectedGroup || newGroupName) {
            const groupsFilePath = path.join(launcherRoot, 'instances', 'instgroups.json');
            let groupsData: any;
            
            if (fs.existsSync(groupsFilePath)) {
                const groupsContent = fs.readFileSync(groupsFilePath, 'utf-8');
                groupsData = JSON.parse(groupsContent);
            } else {
                groupsData = {
                    formatVersion: "1",
                    groups: {}
                };
            }
            
            // グループ名を決定
            let groupName = selectedGroup;
            if (newGroupName && newGroupName.trim()) {
                groupName = newGroupName.trim();
            }
            
            if (groupName) {
                // グループが存在しない場合は作成
                if (!groupsData.groups[groupName]) {
                    groupsData.groups[groupName] = {
                        hidden: false,
                        instances: []
                    };
                }
                
                // インスタンスをグループに追加（重複チェック）
                if (!groupsData.groups[groupName].instances.includes(instanceName)) {
                    groupsData.groups[groupName].instances.push(instanceName);
                }
                
                // グループファイルを保存
                fs.writeFileSync(groupsFilePath, JSON.stringify(groupsData, null, 2));
            }
        }

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

// インスタンスグループ一覧取得
ipcMain.handle('get-instance-groups', async (_event, launcherRoot: string) => {
    try {
        const groupsFilePath = path.join(launcherRoot, 'instances', 'instgroups.json');
        
        if (!fs.existsSync(groupsFilePath)) {
            // ファイルが存在しない場合はデフォルトの構造を返す
            return {
                success: true,
                groups: {
                    formatVersion: "1",
                    groups: {}
                }
            };
        }
        
        const groupsData = fs.readFileSync(groupsFilePath, 'utf-8');
        const groups = JSON.parse(groupsData);
        
        return { success: true, groups };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

// インスタンスグループ作成・更新
ipcMain.handle('update-instance-groups', async (_event, launcherRoot: string, groupsData: any) => {
    try {
        const groupsFilePath = path.join(launcherRoot, 'instances', 'instgroups.json');
        
        // ディレクトリが存在しない場合は作成
        const groupsDir = path.dirname(groupsFilePath);
        if (!fs.existsSync(groupsDir)) {
            fs.mkdirSync(groupsDir, { recursive: true });
        }
        
        // グループデータを書き込み
        fs.writeFileSync(groupsFilePath, JSON.stringify(groupsData, null, 2));
        
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

// 自動アップデートチェック
ipcMain.handle('check-for-updates', async () => {
    try {
        const updater = new AutoUpdater();
        const updateInfo = await updater.checkForUpdates();
        return { 
            success: true, 
            hasUpdate: updateInfo.hasUpdate,
            latestVersion: updateInfo.latestVersion
        };
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

// テスト用：AutoUpdaterのテストフロー実行
ipcMain.handle('test-update-flow', async () => {
    try {
        const updater = new AutoUpdater();
        await updater.testUpdateFlow();
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

// テスト用：GitHub APIのテスト
ipcMain.handle('test-github-api', async () => {
    try {
        const updater = new AutoUpdater();
        await updater.testGitHubAPI();
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

// アプリバージョン取得
ipcMain.handle('get-app-version', async () => {
    try {
        return app.getVersion();
    } catch (error: any) {
        return 'Unknown';
    }
});

// Mod Config Handlers
ipcMain.handle('get-installed-mods', async (_event, instancePath: string): Promise<string[]> => {
    try {
        const installedMods: string[] = [];
        const targetMods = ['sodium', 'seedqueue', 'extra-options', 'standardsettings', 'worldpreview'];

        console.log('Checking mods for instance path:', instancePath);
        
        // Try different possible mods directory paths
        const possibleModsPaths = [
            path.join(instancePath, 'mods'),
            path.join(instancePath, 'minecraft', 'mods'),
            path.join(instancePath, '.minecraft', 'mods')
        ];
        
        let modsDir = '';
        let files: string[] = [];
        
        for (const modsPath of possibleModsPaths) {
            console.log('Checking mods directory:', modsPath);
            if (fs.existsSync(modsPath)) {
                modsDir = modsPath;
                files = await fs.promises.readdir(modsPath);
                console.log('Found mods directory:', modsPath);
                console.log('Files in mods directory:', files);
                break;
            }
        }
        
        if (!modsDir) {
            console.log('No mods directory found in any of the expected locations');
            return [];
        }

        for (const modId of targetMods) {
            console.log(`Checking for mod: ${modId}`);
            // Find a file that contains the modId (e.g., "sodium-2.4.1+1.16.1.jar", "seedqueue-1.4.1.jar")
            const matchingFiles = files.filter(file => {
                const lowerFile = file.toLowerCase();
                const lowerModId = modId.toLowerCase();
                
                // Check various patterns based on actual file names
                const patterns = [
                    `${lowerModId}-`, // modId followed by hyphen (e.g., "sodium-", "seedqueue-")
                    `${lowerModId}.jar`, // exact modId.jar (fallback)
                ];
                
                const matches = lowerFile.endsWith('.jar') && 
                               patterns.some(pattern => lowerFile.startsWith(pattern));
                
                console.log(`  File: ${file}, patterns checked:`, patterns);
                console.log(`  Matches: ${matches}`);
                return matches;
            });
            
            if (matchingFiles.length > 0) {
                console.log(`Found matching files for ${modId}:`, matchingFiles);
                installedMods.push(modId);
            }
        }
        
        console.log('Final installed mods:', installedMods);
        return installedMods;
    } catch (error) {
        console.error('Failed to read mods directory:', error);
        return [];
    }
});

ipcMain.handle('get-mod-config', async (_event, instancePath: string, modId: string) => {
    try {
        // Try different possible config directory paths
        const possibleConfigPaths = [
            path.join(instancePath, 'config', 'mcsr'),
            path.join(instancePath, 'minecraft', 'config', 'mcsr'),
            path.join(instancePath, '.minecraft', 'config', 'mcsr')
        ];
        
        let configFile = '';
        for (const configPath of possibleConfigPaths) {
            const testFile = path.join(configPath, `${modId}.json`);
            if (fs.existsSync(testFile)) {
                configFile = testFile;
                break;
            }
        }
        
        if (configFile) {
            const content = await fs.promises.readFile(configFile, 'utf-8');
            return JSON.parse(content);
        }
        return null; // Return null if no config file exists
    } catch (error: any) {
        console.error(`Failed to read or parse config for ${modId}:`, error);
        return null;
    }
});

ipcMain.handle('save-mod-config', async (_event, instancePath: string, modId: string, config: any) => {
    try {
        // Use the first possible config directory path
        const configDir = path.join(instancePath, 'minecraft', 'config', 'mcsr');
        const configFile = path.join(configDir, `${modId}.json`);
        
        if (!fs.existsSync(configDir)) {
            await fs.promises.mkdir(configDir, { recursive: true });
        }
        await fs.promises.writeFile(configFile, JSON.stringify(config, null, 2), 'utf-8');
        return { success: true };
    } catch (error: any) {
        console.error(`Failed to save config for ${modId}:`, error);
        return { success: false, error: error.message };
    }
});

// Get default mod config from settings
ipcMain.handle('get-default-mod-config', async (_event, modId: string) => {
    try {
        const settingsPath = path.join(__dirname, '..', '..', 'wk', 'settings', `${modId}.json`);
        console.log('Loading default config from:', settingsPath);
        
        if (fs.existsSync(settingsPath)) {
            const content = await fs.promises.readFile(settingsPath, 'utf-8');
            return JSON.parse(content);
        }
        console.log('Default config file not found for:', modId);
        return null;
    } catch (error: any) {
        console.error(`Failed to read default config for ${modId}:`, error);
        return null;
    }
});

// Test mod detection from wk/settings/mods (for debugging)
ipcMain.handle('test-mod-detection', async () => {
    try {
        const modsDir = path.join(__dirname, '..', '..', 'wk', 'settings', 'mods');
        console.log('Testing mod detection from:', modsDir);
        
        if (!fs.existsSync(modsDir)) {
            console.log('Test mods directory does not exist');
            return { success: false, error: 'Mods directory not found' };
        }

        const files = await fs.promises.readdir(modsDir);
        console.log('Test files found:', files);
        
        const targetMods = ['sodium', 'seedqueue', 'extra-options', 'standardsettings', 'worldpreview'];
        const detectedMods: string[] = [];
        
        for (const modId of targetMods) {
            const matchingFiles = files.filter(file => {
                const lowerFile = file.toLowerCase();
                const lowerModId = modId.toLowerCase();
                const patterns = [
                    `${lowerModId}-`,
                    `${lowerModId}.jar`,
                ];
                return lowerFile.endsWith('.jar') && 
                       patterns.some(pattern => lowerFile.startsWith(pattern));
            });
            
            if (matchingFiles.length > 0) {
                detectedMods.push(modId);
                console.log(`Test: Found ${modId} - ${matchingFiles}`);
            }
        }
        
        return { 
            success: true, 
            detectedMods, 
            totalFiles: files.length,
            files 
        };
    } catch (error: any) {
        console.error('Test mod detection failed:', error);
        return { success: false, error: error.message };
    }
});