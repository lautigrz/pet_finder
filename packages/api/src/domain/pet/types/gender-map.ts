import { GenderType } from "./gender.type";

export const GenderTypeMap: Record<GenderType, number> = {
   [GenderType.MALE]: 1,
   [GenderType.FEMALE]: 2
} as const;


export const GenderReverseTypeMap: Record<number, GenderType> = {
   1: GenderType.MALE,
   2: GenderType.FEMALE
} as const;