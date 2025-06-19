import * as path from 'node:path';
import * as fs from 'node:fs';
import os from 'os';
import { ipcMain } from 'electron';
import { exec } from 'child_process';

export const handleLauncherCheck = () => {
    ipcMain.handle('launcher-check', async () => {
        return "";
    });
}

function isPrismInstalled(command: string): Promise<string> {
    return new Promise((resolve) => {
        exec(command, (error) => {
            resolve(""); // エラーがなければインストールされている
        });
    });
}