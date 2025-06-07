interface Window {
    bafv4: {
        selectDest: () => Promise<string | null>,
        openExternal: (url: string) => void,
        startDarwin: (ops: any[], dir: string) => Promise<void>,
        tick: (callback: (state: number, prog: number, target: string) => void) => void,
        sendTotal: (callback: (zips: number, installers: number) => void) => void,
        catchDarwinErr: (callback: (state: number, msg: string) => void) => void,
    },
}