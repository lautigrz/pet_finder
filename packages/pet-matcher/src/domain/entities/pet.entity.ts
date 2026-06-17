export interface PetImageEntity {
  imageId: number;
  photoUrl: string;
  embeddingPhoto: number[] | null;
}

export interface PetEntity {
  petId: number;
  publicId: string;
  petName: string;
  images: PetImageEntity[];
}
