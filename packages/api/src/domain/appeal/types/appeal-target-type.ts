export const AppealTargetType = {
  POST: 'POST',
  ACCOUNT: 'ACCOUNT',
} as const

export const appealTargetTypeMap: Record<AppealTargetType, number> = {
  [AppealTargetType.POST]: 1,
  [AppealTargetType.ACCOUNT]: 2,
}

export const appealTargetTypeMapReverse: Record<number, AppealTargetType> = {
  [1]: AppealTargetType.POST,
  [2]: AppealTargetType.ACCOUNT,
}

export type AppealTargetType = typeof AppealTargetType[keyof typeof AppealTargetType]

export const isValidAppealTargetType = (value: string): value is AppealTargetType =>
  Object.values(AppealTargetType).includes(value as AppealTargetType)
