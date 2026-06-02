import { GenderType } from "@domain/shared/gender-type/gender.type";
import { SizeType } from "@domain/shared/size-type/size.type";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import z from "zod";

export const petSchema = z.object({
    name: z.string().min(2).max(100),
    animalType: z.string().toUpperCase().pipe(z.nativeEnum(AnimalType)),
    genderType: z.string().toUpperCase().pipe(z.nativeEnum(GenderType)),
    sizeType: z.string().toUpperCase().pipe(z.nativeEnum(SizeType)),
    color: z.string().max(50),
    hasIdCollar: z.boolean(),
    isVaccinated: z.boolean(),
    breed: z.string().max(100),
});

export const createPetRequestSchema = z.object({
    body: petSchema,
    query: z.object({}).optional(),
    params: z.object({}).optional(),
});


export type CreatePetInput = z.infer<typeof petSchema>;