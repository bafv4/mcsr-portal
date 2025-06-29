import { contextBridge, ipcRenderer, shell } from 'electron';

contextBridge.exposeInMainWorld('bafv4', {
    /** フォルダ選択 */
    selectDest: () => ipcRenderer.invoke('select-dest'),
    /** リンクをブラウザで開く */
    openExternal: (url: string) => openExternal(url),
    /** ダウンロード開始 */
    startDarwin: (options: any[], dir: string) => ipcRenderer.invoke('start-download', options, dir),
    /** Prism Launcherのインストール確認 */
    checkPrismLauncher: () => ipcRenderer.invoke('check-prism-launcher'),
    /** インスタンス作成 */
    createInstance: (instanceData: any) => ipcRenderer.invoke('create-instance', instanceData),
    /** ディレクトリ作成 */
    createDirectory: (dirPath: string) => ipcRenderer.invoke('create-directory', dirPath),
    /** Java実行ファイル選択 */
    selectJavaExecutable: () => ipcRenderer.invoke('select-java-executable'),
    /** 自動アップデートチェック */
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    /** 手動アップデート実行 */
    performUpdate: () => ipcRenderer.invoke('perform-update'),
    /** テスト用：AutoUpdaterのテストフロー実行 */
    testUpdateFlow: () => ipcRenderer.invoke('test-update-flow'),
    /** テスト用：GitHub APIのテスト */
    testGitHubAPI: () => ipcRenderer.invoke('test-github-api'),
    /** プログレス更新 */
    tick: (callback: (state: number, prog: number, target: string) => void) => {
        ipcRenderer.on('tick', (_, state, prog, target) => callback(state, prog, target));
    },
    /** ファイル数通知 */
    sendTotal: (callback: (zips: number, installers: number) => void) => {
        ipcRenderer.on('total-files', (_, zips, installers) => callback(zips, installers));
    },
    /** エラーハンドリング */
    catchDarwinErr: (callback: (state: number, errMsg: string) => void) => {
        ipcRenderer.on('darwin-err', (_, state, msg) => callback(state, msg));
    },
    /** 翻訳 */
    translate: (text: string) => ipcRenderer.invoke('translate', text),
    /** インスタンスグループ一覧取得 */
    getInstanceGroups: (launcherRoot: string) => ipcRenderer.invoke('get-instance-groups', launcherRoot),
    /** インスタンスグループ作成・更新 */
    updateInstanceGroups: (launcherRoot: string, groupsData: any) => ipcRenderer.invoke('update-instance-groups', launcherRoot, groupsData),
    /** modsディレクトリ内のファイル一覧を取得 */
    listFiles: (dirPath: string) => ipcRenderer.invoke('list-files', dirPath),
    /** ファイル削除 */
    removeFile: (filePath: string) => ipcRenderer.invoke('remove-file', filePath),
    /** ファイルダウンロード */
    downloadFile: (url: string, destPath: string) => ipcRenderer.invoke('download-file', url, destPath)
});

const openExternal = (url: string) => {
    if (/^https?:\/\//.test(url)) {
        shell.openExternal(url);
    }
};