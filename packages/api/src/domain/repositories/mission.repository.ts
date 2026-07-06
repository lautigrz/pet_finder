import { Mission } from "../mission/Mission";

export abstract class MissionRepository {

  abstract save(mission: Mission): Promise<number>;

  abstract findByPublicId(publicId: string): Promise<Mission | null>;

  abstract findActive(): Promise<Mission[]>;
  
 abstract findByReportId(reportId: number): Promise<Mission | null>;

abstract update(mission: Mission): Promise<void>;




}