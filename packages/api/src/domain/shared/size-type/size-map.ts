import { SizeType } from "./size.type";

export const SizeTypeMap: Record<SizeType, number> = {
   [SizeType.SMALL]: 1,
   [SizeType.MEDIUM]: 2,
   [SizeType.LARGE]: 3
} as const;

export const SizeReverseTypeMap: Record<number, SizeType> = {
   1: SizeType.SMALL,
   2: SizeType.MEDIUM,
   3: SizeType.LARGE
} as const;