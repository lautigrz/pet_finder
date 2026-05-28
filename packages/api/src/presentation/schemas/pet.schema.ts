import { GenderType } from "@domain/pet/types/gender.type";
import { SizeType } from "@domain/pet/types/size.type";
import { AnimalType } from "@domain/shared/animal-type/animal-type";
import z from "zod";

export const petSchema = z.object({
    name: z.string().min(2).max(100),
    userId: z.number().int(),
    animalType: z.nativeEnum(AnimalType),
    genderType: z.nativeEnum(GenderType),
    sizeType: z.nativeEnum(SizeType),
    color: z.string().max(50),
    hasIdCollar: z.boolean(),
    breed: z.string().max(100),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().nullable().optional()
});