export const GenderType = {
  MALE: 'MALE',
  FEMALE: 'FEMALE'
} as const

export type GenderType = typeof GenderType[keyof typeof GenderType]