export const SizeType = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE'
} as const

export type SizeType = typeof SizeType[keyof typeof SizeType]

export const isValidSizeType = (value: string): value is SizeType =>
  Object.values(SizeType).includes(value as SizeType)