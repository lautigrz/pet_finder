import * as ort from 'onnxruntime-node';
import * as path from 'path';
import { logger } from '@pet-alert/shared';
import { l2Normalize } from '../utils/normalize';

import { Tokenizer } from '@huggingface/tokenizers';
import * as fs from 'fs';


const MODEL_PATH = path.join(__dirname, '../models/e5/model_O4.onnx');
const TOKENIZER_JSON_PATH = path.join(__dirname, '../models/e5/tokenizer.json');
const TOKENIZER_CONFIG_PATH = path.join(__dirname, '../models/e5/tokenizer_config.json');

let tokenizerInstance: Tokenizer | null = null;
let sessionInstance: ort.InferenceSession | null = null;


async function getTokenizer(): Promise<Tokenizer> {
    if (!tokenizerInstance) {
        const tokenizerJson = JSON.parse(fs.readFileSync(TOKENIZER_JSON_PATH, 'utf8'));
        const tokenizerConfig = JSON.parse(fs.readFileSync(TOKENIZER_CONFIG_PATH, 'utf8'));
        tokenizerInstance = new Tokenizer(tokenizerJson, tokenizerConfig);
    }
    return tokenizerInstance;
}

async function getSession(): Promise<ort.InferenceSession> {
    if (!sessionInstance) {
        logger.info('Loading E5 ONNX model...');
        sessionInstance = await ort.InferenceSession.create(MODEL_PATH);
        logger.info('E5 ONNX model loaded successfully');
    }
    return sessionInstance;
}


function meanPool(
    hiddenStates: Float32Array,
    attentionMask: number[],
    seqLength: number,
    hiddenSize: number
): number[] {
    const embedding = new Array(hiddenSize).fill(0);
    let validTokens = 0;

    for (let token = 0; token < seqLength; token++) {
        if (attentionMask[token] === 0) continue;
        validTokens++;
        for (let dim = 0; dim < hiddenSize; dim++) {
            embedding[dim] += hiddenStates[token * hiddenSize + dim];
        }
    }

    for (let dim = 0; dim < hiddenSize; dim++) {
        embedding[dim] /= validTokens;
    }

    return embedding;
}


export async function extractDescriptionEmbedding(text: string): Promise<number[] | null> {
    const trimmed = text?.trim();

    if (!trimmed) {
        logger.warn('Text is empty');
        return null;
    }

    const [session, tokenizer] = await Promise.all([getSession(), getTokenizer()]);

    const encoded = tokenizer.encode(`passage: ${trimmed}`);
    const ids = encoded.ids;
    const mask = encoded.attention_mask;
    const tokenTypeIds = new Array(ids.length).fill(0);

    const feeds = {
        input_ids: new ort.Tensor(
            'int64',
            BigInt64Array.from(ids.map(BigInt)),
            [1, ids.length]
        ),
        attention_mask: new ort.Tensor(
            'int64',
            BigInt64Array.from(mask.map(BigInt)),
            [1, mask.length]
        ),
        token_type_ids: new ort.Tensor(
            'int64',
            BigInt64Array.from(tokenTypeIds.map(BigInt)),
            [1, tokenTypeIds.length]
        ),
    };

    const results = await session.run(feeds);
    const output = results.last_hidden_state;

    const pooled = meanPool(
        output!.data as Float32Array,
        mask,
        output!.dims[1]!,
        output!.dims[2]!
    );
    return l2Normalize(pooled);
}

export async function warmupDescriptionModel(): Promise<void> {
    logger.info('Ready to run description embedding model');
    await extractDescriptionEmbedding('Ready for description');
    logger.info('Description embedding model is ready');
}

