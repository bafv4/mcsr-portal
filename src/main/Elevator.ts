import os from 'os';
import { exec } from 'child_process';
import _path from 'path';

/**
 * 管理者権限でインストーラや任意の実行ファイルを実行する（Windows/macOS）
 * @param executablePath 実行するexeやappのパス（絶対パス推奨）
 * @param args コマンドライン引数（オプション）
 * @returns Promiseで実行結果を返す
 */
export function runElevated(
    executablePath: string,
    args: string[] = []
): Promise<void> {
    const platform = os.platform();
    const quotedArgs = args.map(arg => `"${arg}"`).join(' ');

    return new Promise((resolve, reject) => {
        if (platform === 'win32') {
            // PowerShell経由でUAC昇格
            const psCommand = [
                'powershell',
                '-Command',
                `"Start-Process -FilePath '${executablePath}' -ArgumentList '${quotedArgs}' -Verb RunAs"`
            ].join(' ');

            exec(psCommand, (error, _stdout, _stderr) => {
                if (error) {
                    reject(new Error(error.message));
                } else {
                    resolve();
                }
            });
        } else if (platform === 'darwin') {
            // AppleScript経由で昇格実行
            const safeCommand = `${executablePath} ${quotedArgs}`.replace(/"/g, '\\"');
            const osaCommand = `osascript -e 'do shell script "${safeCommand}" with administrator privileges'`;

            exec(osaCommand, (error, _stdout, _stderr) => {
                if (error) {
                    reject(new Error(error.message));
                } else {
                    resolve();
                }
            });
        } else {
            reject(new Error(`${platform} is not supported`));
        }
    });
}
