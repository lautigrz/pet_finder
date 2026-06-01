export const SizeType = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE'
} as const

export type SizeType = typeof SizeType[keyof typeof SizeType]