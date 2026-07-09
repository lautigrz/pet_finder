import { Mission as PrismaMission, MissionVolunteer as PrismaMissionVolunteer } from "@prisma/client";
import { Mission } from "@domain/mission/Mission";
import { SearchArea } from "@domain/mission/value-objects/search-area.vo";
import { missionStatusMap, missionStatusMapReverse } from "@domain/mission/types/mission.status";

export type PrismaMissionWithVolunteers = PrismaMission & {
  volunteers?: PrismaMissionVolunteer[];
};

export class MissionMapper {
  static toDomain(record: PrismaMissionWithVolunteers): Mission {
    const searchArea = SearchArea.create(
      record.latitude,
      record.longitude,
      record.radius
    );

    const status = missionStatusMapReverse[record.mission_status_id] || 'OPEN';
    const volunteerIds = record.volunteers ? record.volunteers.map(v => v.user_id) : [];

    return Mission.restore({
      missionId: record.mission_id,
      publicId: record.public_id,
      reportId: record.report_id,
      searchArea,
      title: record.title ?? "",
      description: record.description ?? "",
      status,
      volunteerIds,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  }

  static toPersistence(mission: Mission): Omit<PrismaMission, "mission_id" | "volunteers"> {
    return {
      public_id: mission.publicId,
      report_id: mission.reportId,
      latitude: mission.searchArea.latitude,
      longitude: mission.searchArea.longitude,
      radius: mission.searchArea.radius,
      title: mission.title,
      description: mission.description,
      mission_status_id: missionStatusMap[mission.status],
      created_at: mission.createdAt,
      updated_at: mission.updatedAt
    };
  }

}