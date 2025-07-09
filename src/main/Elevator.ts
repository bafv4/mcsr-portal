import os from 'os';
import { exec } from 'child_process';
import jschardet from 'jschardet';
import iconv from 'iconv-lite';

/**
 * 管理者権限でコマンドを実行する（Windows/macOS対応）
 * @param executablePath 実行ファイルの絶対パス
 * @param args 引数の配列（省略可）
 * @returns Promise<void>
 */
export function runElevated(
    executablePath: string,
    args: string[] = []
): Promise<void> {
    const platform = os.platform();
    const quotedArgs = args.map((arg) => `"${arg}"`).join(' ');

    return new Promise((resolve, reject) => {
        if (platform === 'win32') {
            const command = [
                'powershell',
                '-NoProfile',
                '-ExecutionPolicy Bypass',
                '-Command',
                `"& { Start-Process -FilePath '${executablePath}' -ArgumentList '${quotedArgs}' -Verb RunAs }"`
            ].join(' ');

            exec(command, { encoding: 'buffer' }, (error, stdout, stderr) => {
                handleOutput(error, stdout, stderr, reject, resolve);
            });
        } else if (platform === 'darwin') {
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
            reject(new Error(`Unsupported OS: ${platform}`));
        }
    });
}

// 出力のエンコーディング自動判別 & デコード
function handleOutput(
    error: any,
    stdout: Buffer,
    stderr: Buffer,
    reject: (reason?: any) => void,
    resolve: () => void
) {
    const decode = (buf: Buffer): string => {
        const result = jschardet.detect(buf);
        const encoding = result.encoding?.toLowerCase();
        const selected = encoding && iconv.encodingExists(encoding)
            ? encoding
            : 'utf-8';
        return iconv.decode(buf, selected);
    };

    const errOut = decode(error?.message ? Buffer.from(error.message) : Buffer.alloc(0));
    const stdErr = decode(stderr);
    const stdOut = decode(stdout);

    if (error) {
        reject(new Error(`Windows 管理者実行エラー:\n${errOut || stdErr}`));
    } else {
        console.log('[runElevated] 出力:', stdOut.trim());
        resolve();
    }
}