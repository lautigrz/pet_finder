import { MissionUpdate } from "../MissionUpdate";

export interface MissionUpdateRepository {
  save(update: MissionUpdate): Promise<number>;
  findByMissionId(missionId: number): Promise<MissionUpdate[]>;
  findByUser(userId: number): Promise<any[]>;
}
