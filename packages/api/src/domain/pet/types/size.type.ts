export const SizeType = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
} as const

export type SizeType = typeof SizeType[keyof typeof SizeType]