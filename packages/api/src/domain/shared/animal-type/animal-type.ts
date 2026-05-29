export const AnimalType = {
   DOG: "dog",
   CAT: "cat"
} as const;

export type AnimalType =
   typeof AnimalType[keyof typeof AnimalType];