import { MissionUpdate } from "../MissionUpdate";
import { PointValue } from "../value-objects/point-value.vo";

export interface MissionUpdateRepository {
  save(update: MissionUpdate): Promise<number>;
  findByMissionId(missionId: number): Promise<MissionUpdate[]>;
  findByUser(userId: number): Promise<any[]>;
  findPointByContext(context: string): Promise<PointValue[]>;
  update(update: MissionUpdate): Promise<void>;
  findByPublicId(publicId: string): Promise<MissionUpdate | null>;
}
