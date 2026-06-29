
export { logger } from './logger'

export type { MatchingJobData } from "./types/matching-job-data";

export type { MatchNotification, MatchRole } from "./types/match-notification";
export { MATCH_CHANNEL, MATCH_EVENT, MATCH_NOTIFICATION_THRESHOLD } from "./types/match-notification";

export const DataChangeType = {
    IMAGE: 'IMAGE',
    DESCRIPTION: 'DESCRIPTION',
    LOCATION: 'LOCATION',
    ATTRIBUTES: 'ATTRIBUTES',
} as const

export type DataChangeType = typeof DataChangeType[keyof typeof DataChangeType];

export const TypeJob = {
    RUN_MATCHING: 'run_matching',
    REFRESH_MATCHING: 'refresh_matching'
} as const

export type TypeJob = typeof TypeJob[keyof typeof TypeJob];