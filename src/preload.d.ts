interface Window {
    bafv4: {
        selectDest: () => Promise<string | null>,
        openExternal: (url: string) => void,
        startDarwin: (url: ItemInfo[], dir: string) => Promise<void>,
        stateTick: (callback: (prog: number, state: State, target: string) => void) => void,
    },
}