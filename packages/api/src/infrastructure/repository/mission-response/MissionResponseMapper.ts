import { MissionResponse as PrismaMissionResponse } from "@prisma/client";
import { MissionResponse } from "@domain/mission-response/MissionResponse";

export class MissionResponseMapper {

  static toDomain(record: PrismaMissionResponse): MissionResponse {

    return new MissionResponse(

      record.response_id,

      record.public_id,

      record.mission_id,

      record.user_id,

      record.comment,

      record.photo_url,

      record.status,

      record.created_at

    );

  }

}