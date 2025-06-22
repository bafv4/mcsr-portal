export {};

declare global {
  interface Window {
    bafv4: {
      selectDest: () => Promise<string | undefined>;
      selectJavaExecutable: () => Promise<string | undefined>;
      translate: (text: string) => Promise<string>;
      // AutoUpdater APIs
      onUpdateAvailable: (callback: (version: string) => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
      onError: (callback: (err: Error) => void) => void;
      checkForUpdates: () => Promise<{ hasUpdate: boolean, version: string, error?: any }>;
      installUpdate: () => void;
      getAppVersion: () => Promise<string>;
      testUpdateFlow: () => Promise<{ success: boolean, message: string }>;
      // Mod Config APIs
      getInstalledMods: (instancePath: string) => Promise<string[]>;
      getModConfig: (instancePath: string, modId: string) => Promise<any>;
      saveModConfig: (instancePath: string, modId: string, config: any) => Promise<void>;
      getDefaultModConfig: (modId: string) => Promise<any>;
      testModDetection: () => Promise<{ success: boolean; detectedMods?: string[]; totalFiles?: number; files?: string[]; error?: string }>;
    }
  }
} 