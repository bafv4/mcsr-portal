export interface Bafv4Api {
    selectDest: () => Promise<string | null>;
    openExternal: (url: string) => void;
    startDarwin: (options: any[], dir: string) => Promise<void>;
    checkPrismLauncher: () => Promise<string | null>;
    createInstance: (instanceData: any) => Promise<{ success: boolean; error?: string }>;
    createDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
    selectJavaExecutable: () => Promise<string | null>;
    getInstanceGroups: (launcherRoot: string) => Promise<{ success: boolean; groups?: any; error?: string }>;
    updateInstanceGroups: (launcherRoot: string, groupsData: any) => Promise<{ success: boolean; error?: string }>;
    checkForUpdates: () => Promise<{ success: boolean; hasUpdate?: boolean; latestVersion?: string; error?: string }>;
    performUpdate: () => Promise<{ success: boolean; error?: string }>;
    testUpdateFlow: () => Promise<{ success: boolean; error?: string }>;
    testGitHubAPI: () => Promise<{ success: boolean; error?: string }>;
    tick: (callback: (state: number, prog: number, target: string) => void) => void;
    sendTotal: (callback: (zips: number, installers: number) => void) => void;
    catchDarwinErr: (callback: (state: number, errMsg: string) => void) => void;
    translate: (text: string) => Promise<string>;
    /** modsディレクトリ内のファイル一覧を取得 */
    listFiles: (dirPath: string) => Promise<string[]>;
    /** ファイル削除 */
    removeFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
    /** ファイルダウンロード */
    downloadFile: (url: string, destPath: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
    interface Window {
        bafv4: Bafv4Api;
    }
}