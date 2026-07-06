import { MissionResponse } from "@domain/mission-response/MissionResponse";

export interface MissionResponseRepository {

  save(response: MissionResponse): Promise<number>;
 findByMissionId(missionId: number): Promise<MissionResponse[]>;

  findByUser(userId: number): Promise<any[]>;


}