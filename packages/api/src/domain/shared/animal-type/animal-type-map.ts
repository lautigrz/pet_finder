import { AnimalType } from "./animal-type";

export const AnimalTypeMap: Record<AnimalType, number> = {
   [AnimalType.DOG]: 1,
   [AnimalType.CAT]: 2
} as const;

export const AnimalReverseTypeMap: Record<number, AnimalType> = {
   1: AnimalType.DOG,
   2: AnimalType.CAT
} as const;