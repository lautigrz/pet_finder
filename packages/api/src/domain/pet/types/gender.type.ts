export const GenderType = {
  MALE: 'male',
  FEMALE: 'female'
} as const

export type GenderType = typeof GenderType[keyof typeof GenderType]