import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import * as path from 'path';
import { logger } from '@pet-alert/shared';
import { l2Normalize } from '../utils/normalize';


const MODEL_PATH = path.join(__dirname, '../models/dinov2/dinov2.onnx');

let sessionInstance: ort.InferenceSession | null = null;

async function getSession(): Promise<ort.InferenceSession> {
    if (!sessionInstance) {
        logger.info('Loading DinoV2 model...');
        sessionInstance = await ort.InferenceSession.create(MODEL_PATH);
        logger.info('DinoV2 model loaded successfully');
    }
    return sessionInstance;
}


async function preprocessImage(imageBuffer: Buffer): Promise<ort.Tensor> {
    const { data } = await sharp(imageBuffer)
        .resize(518, 518, { fit: 'cover' })
        .removeAlpha()
        // .normalise()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const float32 = new Float32Array(3 * 518 * 518);
    const HW = 518 * 518;

    for (let i = 0; i < HW; i++) {
        const r = data[i * 3]!;
        const g = data[i * 3 + 1]!;
        const b = data[i * 3 + 2]!;

        float32[i] = (r / 255.0 - 0.485) / 0.229;
        float32[HW + i] = (g / 255.0 - 0.456) / 0.224;
        float32[HW * 2 + i] = (b / 255.0 - 0.406) / 0.225;
    }


    return new ort.Tensor('float32', float32, [1, 3, 518, 518]);
}


export async function extractEmbedding(imageBuffer: Buffer): Promise<number[] | null> {
    const session = await getSession();

    const tensor = await preprocessImage(imageBuffer);

    const feeds: Record<string, ort.Tensor> = { data: tensor };

    const results = await session.run(feeds);

    if (!results['features'] || !results['features'].data) {
        logger.error('No features in the output');
        throw new Error('No features in the output');
    }

    const outputTensor = Array.from(results['features'].data as Float32Array);

    if (outputTensor.every((value) => value === 0)) {
        return null;
    }

    return l2Normalize(outputTensor);

}


export async function warmupModel(): Promise<void> {
    const session = await getSession();

    const dummy = new ort.Tensor('float32', new Float32Array(1 * 3 * 518 * 518), [1, 3, 518, 518]);
    await session.run({ data: dummy });
    logger.info('Model warmed up successfully');
}