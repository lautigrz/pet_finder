export const AppealStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const

export const appealStatusMap: Record<AppealStatus, number> = {
  [AppealStatus.PENDING]: 1,
  [AppealStatus.ACCEPTED]: 2,
  [AppealStatus.REJECTED]: 3,
}

export const appealStatusMapReverse: Record<number, AppealStatus> = {
  [1]: AppealStatus.PENDING,
  [2]: AppealStatus.ACCEPTED,
  [3]: AppealStatus.REJECTED,
}

export type AppealStatus = typeof AppealStatus[keyof typeof AppealStatus]

export const isValidAppealStatus = (value: string): value is AppealStatus =>
  Object.values(AppealStatus).includes(value as AppealStatus)
