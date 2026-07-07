import { MissionUpdate as PrismaMissionUpdate } from "@prisma/client";
import { MissionUpdate } from "@domain/mission/MissionUpdate";

export class MissionUpdateMapper {
  static toDomain(record: PrismaMissionUpdate): MissionUpdate {
    return MissionUpdate.restore({
      updateId: record.update_id,
      publicId: record.public_id,
      missionId: record.mission_id,
      userId: record.user_id,
      comment: record.comment,
      photoUrl: record.photo_url,
      status: record.status,
      createdAt: record.created_at
    });
  }


  static toPersistence(update: MissionUpdate): Omit<PrismaMissionUpdate, "update_id"> {
    return {
      public_id: update.publicId,
      mission_id: update.missionId,
      user_id: update.userId,
      comment: update.comment,
      photo_url: update.photoUrl,
      status: update.status,
      created_at: update.createdAt
    };
  }

}
