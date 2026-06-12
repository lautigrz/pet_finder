import { isValidAnimalType } from '@domain/shared/animal-type/animal-type';
import { z } from 'zod';

export const getBreedsRequestSchema = z.object({
    query: z.object({
        animalType: z.string()
            .transform(value => value.toUpperCase())
            .refine(value => isValidAnimalType(value))
            .optional(),
    }),
});

export type GetBreedsQuery = z.infer<typeof getBreedsRequestSchema>['query'];
