import fs from 'fs';
import path from 'path';
import https from 'https';
import unzipper from 'unzipper';
import { logger } from '@pet-alert/shared';
import http from 'http';

const MODELS_DIR = path.resolve(__dirname, '../../../models');
console.log('MODELS_DIR:', MODELS_DIR);
console.log('__dirname:', __dirname);


const MODELS = [
    {
        name: 'dinov2',
        dir: path.join(MODELS_DIR, 'dinov2'),
        url: 'https://github.com/lautigrz/pet-matcher-models/releases/download/v1.0-models/dinov2.zip'
    },
    {
        name: 'e5',
        dir: path.join(MODELS_DIR, 'e5'),
        url: 'https://github.com/lautigrz/pet-matcher-models/releases/download/v1.0-models/e5.zip'
    }
]



async function downloadFile(url: string, dest: string, modelName: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = (targetUrl: string) => {
            const lib = targetUrl.startsWith('https') ? https : http;
            lib.get(targetUrl, response => {
                if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
                    response.resume();
                    request(response.headers.location!);
                    return;
                }

                if (response.statusCode !== 200) {
                    response.resume();
                    reject(new Error(`Failed to download ${modelName}, status: ${response.statusCode}`));
                    return;
                }

                const totalSize = parseInt(response.headers['content-length'] ?? '0', 10);
                let downloaded = 0;
                const file = fs.createWriteStream(dest);

                response.on('data', (chunk: Buffer) => {
                    downloaded += chunk.length;
                    if (totalSize > 0) {
                        const percent = ((downloaded / totalSize) * 100).toFixed(1);
                        const mb = (downloaded / 1024 / 1024).toFixed(1);
                        const total = (totalSize / 1024 / 1024).toFixed(1);
                        process.stdout.write(`\r[${modelName}] Descargando... ${mb}MB / ${total}MB (${percent}%)`);
                    }
                });

                response.pipe(file);
                file.on('finish', () => file.close(() => resolve()));
                file.on('error', reject);
            }).on('error', reject);
        };
        request(url);
    });
}

async function downloadAndExtract(url: string, modelName: string): Promise<void> {
    const zipPath = path.join(MODELS_DIR, `${modelName}.zip`);

    await downloadFile(url, zipPath, modelName);

    process.stdout.write(`\n`);
    logger.info(`Extrayendo ${modelName}...`);

    await new Promise<void>((resolve, reject) => {
        const pending: Promise<void>[] = [];

        fs.createReadStream(zipPath)
            .pipe(unzipper.Parse())
            .on('entry', (entry: unzipper.Entry) => {
                const destPath = path.join(MODELS_DIR, entry.path);
                logger.info(`Entrada: ${entry.path} (${entry.type})`);
                if (entry.type === 'Directory') {
                    fs.mkdirSync(destPath, { recursive: true });
                    entry.autodrain();
                    return;
                }

                fs.mkdirSync(path.dirname(destPath), { recursive: true });

                const p = new Promise<void>((res, rej) => {
                    entry
                        .pipe(fs.createWriteStream(destPath))
                        .on('finish', res)
                        .on('error', rej);
                });

                pending.push(p);
            })
            .on('close', () => {
                Promise.all(pending).then(() => {
                    logger.info(`Extracted ${modelName} successfully`)
                    resolve()
                }).catch((err) => {
                    logger.error(`Error extracting ${modelName}`, err)
                    reject(err)
                })
            })
            .on('error', (err) => {
                logger.error(`Error extracting ${modelName}`, err)
                reject(err)
            });
    });
    fs.unlinkSync(zipPath);
}

export async function ensureModelsExist(): Promise<void> {

    fs.mkdirSync(MODELS_DIR, { recursive: true });

    for (const model of MODELS) {
        if (fs.existsSync(model.dir)) {
            logger.info(`Model ${model.name} already exists`)
            continue;
        }

        logger.info(`Model ${model.name} not found, downloading...`)

        await downloadAndExtract(model.url, model.name)

        logger.info(`Model ${model.name} downloaded successfully`)
    }
}