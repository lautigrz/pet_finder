import { Mission as PrismaMission } from "@prisma/client";
import { Mission } from "@domain/mission/Mission";

export class MissionMapper {

  static toDomain(record: PrismaMission): Mission {

    return new Mission(

      record.mission_id,
      record.public_id,
      record.report_id,
      record.latitude,
      record.longitude,
      record.radius,
      record.title ?? "",
      record.description ?? "",
      record.status,
      record.created_at,
      record.updated_at

    );

  }

}