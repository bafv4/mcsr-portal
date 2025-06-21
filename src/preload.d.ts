interface Window {
    bafv4: {
        selectDest: () => Promise<string | null>,
        openExternal: (url: string) => void,
        startDarwin: (ops: any[], dir: string) => Promise<void>,
        checkPrismLauncher: () => Promise<string | null>,
        createInstance: (instanceData: any) => Promise<{ success: boolean, error?: string }>,
        createDirectory: (dirPath: string) => Promise<{ success: boolean, error?: string }>,
        checkForUpdates: () => Promise<{ success: boolean, hasUpdate?: boolean, error?: string }>,
        performUpdate: () => Promise<{ success: boolean, error?: string }>,
        tick: (callback: (state: number, prog: number, target: string) => void) => void,
        sendTotal: (callback: (zips: number, installers: number) => void) => void,
        catchDarwinErr: (callback: (state: number, msg: string) => void) => void,
    },
}