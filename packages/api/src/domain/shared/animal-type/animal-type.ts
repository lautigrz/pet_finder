export const AnimalType = {
   DOG: "DOG",
   CAT: "CAT"
} as const;

export type AnimalType =
   typeof AnimalType[keyof typeof AnimalType];

export const isValidAnimalType = (value: string): value is AnimalType =>
   Object.values(AnimalType).includes(value as AnimalType);