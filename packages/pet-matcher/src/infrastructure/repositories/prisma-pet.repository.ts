import prisma from '@infrastructure/prisma/prisma.client';
import { IPetRepository } from '@domain/repositories/pet.repository';
import { PetEntity, PetImageEntity } from '@domain/entities/pet.entity';

export class PrismaPetRepository implements IPetRepository {

  async updateImageEmbedding(imageId: number, embedding: number[]): Promise<void> {
    const vector = `[${embedding.join(',')}]`;
    await prisma.$executeRaw`
      UPDATE pet_images
      SET embedding_photo = ${vector}::vector
      WHERE image_id = ${imageId}
    `;
  }



  private toEntity(pet: any): PetEntity {
    const images: PetImageEntity[] = (pet.petImages ?? []).map((img: any) => ({
      imageId: img.imageId,
      photoUrl: img.photoUrl,
      embeddingPhoto: this.parseVector(img.embedding_photo),
    }));

    return {
      petId: pet.pet_id,
      publicId: pet.public_id,
      petName: pet.pet_name,
      images,
    };
  }

  private parseVector(raw: unknown): number[] | null {
    if (!raw) return null;
    if (Array.isArray(raw)) return raw as number[];
    if (typeof raw === 'string') return JSON.parse(raw) as number[];
    return null;
  }
}
