import { contextBridge, ipcRenderer, shell } from 'electron';

contextBridge.exposeInMainWorld('bafv4', {
    /** フォルダ選択 */
    selectDest: () => ipcRenderer.invoke('select-dest'),
    /** リンクをブラウザで開く */
    openExternal: (url: string) => openExternal(url),
    /** ダウンロード開始 */
    startDarwin: async (options: any[], dir: string) => await ipcRenderer.invoke('start-download', options, dir),
    /** Prism Launcherのインストール確認 */
    checkPrismLauncher: () => ipcRenderer.invoke('check-prism-launcher'),
    /** インスタンス作成 */
    createInstance: (instanceData: any) => ipcRenderer.invoke('create-instance', instanceData),
    /** ディレクトリ作成 */
    createDirectory: (dirPath: string) => ipcRenderer.invoke('create-directory', dirPath),
    /** 自動アップデートチェック */
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    /** 手動アップデート実行 */
    performUpdate: () => ipcRenderer.invoke('perform-update'),
    tick: (callback: (state: number, prog: number, target: string) => void) => {
        ipcRenderer.on('tick', (_, state, prog, target) => callback(state, prog, target));
    },
    sendTotal: (callback: (zips: number, installers: number) => void) => {
        ipcRenderer.on('total-files', (_, zips, installers) => callback(zips, installers));
    },
    catchDarwinErr: (callback: (state: number, errMsg: string) => void) => {
        ipcRenderer.on('darwin-err', (_, state, msg) => callback(state, msg));
    },
});

const openExternal = (url: string) => {
    if (/^https?:\/\//.test(url)) {
        shell.openExternal(url);
    } else {
        console.warn("Invalid URL:", url);
    }
};