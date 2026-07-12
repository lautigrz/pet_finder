import { Mission } from "../Mission";

export interface MissionRepository {

  save(mission: Mission): Promise<number>;

  findByPublicId(publicId: string): Promise<Mission | null>;

  findActive(): Promise<Mission[]>;

  findByReportId(reportId: number): Promise<Mission | null>;

  findByVolunteerId(volunteerId: number): Promise<Mission[]>;

  update(mission: Mission): Promise<void>;

  findById(missionId: number): Promise<Mission | null>;
}