import axios from 'axios';
import path from 'node:path';
import sudo from 'sudo-prompt';
import extract from "extract-zip"
import * as fs from 'fs';

export const calcSize = async (urls: string[]) => {
    console.log(urls);
    const sizes = await Promise.all(
        urls.map(async (url) => {
            const res = await axios.head(url);
            const len = res.headers['content-length'];
            return len ? parseInt(len, 10) : 0;
        })
    );
    return sizes.reduce((acc, size) => acc + size, 0);
};

export const extractZip = async (zipPath: string): Promise<void> => {
    await extract(zipPath, { dir: path.dirname(zipPath) });
    fs.unlinkSync(zipPath);
};

export const runInstaller = (exePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const command = `"${path.resolve(exePath)}"`;
        const options = {
            name: 'MCSR Starter App Installer',
        };

        sudo.exec(command, options, (error, _stdout, _stderr) => {
            if (error) {
                reject(error);
            } else {
                console.log('Installer finished successfully.');
                fs.unlinkSync(exePath);
                resolve();
            }
        });
    });
};