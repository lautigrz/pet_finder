
export interface IPetRepository {

  updateImageEmbedding(imageId: number, embedding: number[]): Promise<void>;
}
