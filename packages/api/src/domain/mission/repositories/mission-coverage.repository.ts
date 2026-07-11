export interface MissionCoverageRepository {
  saveCoverage(missionId: number, userId: number, cells: string[]): Promise<void>;
  getCoverage(missionId: number, since?: Date): Promise<{ cells: string[]; lastSyncTimestamp: Date }>;
}
