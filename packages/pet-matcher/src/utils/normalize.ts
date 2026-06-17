export function l2Normalize(vec: number[]): number[] {
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return norm === 0 ? vec : vec.map(v => v / norm);
}


export function cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
        throw new Error(
            `cosineSimilarity: dimension mismatch — vec1.length=${vec1.length}, vec2.length=${vec2.length}. ` +
            `Ensure both embeddings come from the same model version.`
        );
    }

    return vec1.reduce((sum: number, val: number, i: number) => sum + val * vec2[i]!, 0);
}

export function embeddingToSQL(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
}
