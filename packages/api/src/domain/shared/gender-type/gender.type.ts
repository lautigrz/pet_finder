export const GenderType = {
  MALE: 'MALE',
  FEMALE: 'FEMALE'
} as const

export type GenderType = typeof GenderType[keyof typeof GenderType]

export const isValidGenderType = (value: string): value is GenderType =>
  Object.values(GenderType).includes(value as GenderType)