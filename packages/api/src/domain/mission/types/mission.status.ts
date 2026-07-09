export const MissionStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED'
} as const

export const missionStatusMap: Record<MissionStatus, number> = {
  [MissionStatus.OPEN]: 1,
  [MissionStatus.IN_PROGRESS]: 2,
  [MissionStatus.CLOSED]: 3,
}

export const missionStatusMapReverse: Record<number, MissionStatus> = {
  [1]: MissionStatus.OPEN,
  [2]: MissionStatus.IN_PROGRESS,
  [3]: MissionStatus.CLOSED,
}

export type MissionStatus = typeof MissionStatus[keyof typeof MissionStatus]

export const isValidMissionStatus = (value: string): value is MissionStatus =>
  Object.values(MissionStatus).includes(value as MissionStatus)
