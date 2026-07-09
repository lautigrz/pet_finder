import { MissionUpdate as PrismaMissionUpdate, Prisma } from "@prisma/client";
import { MissionUpdate } from "@domain/mission/MissionUpdate";
import { PointValue } from "@domain/mission/value-objects/point-value.vo";

type MissionUpdateWithPoint = PrismaMissionUpdate & {
  pointValue: {
    points: number;
    label: string | null;
  } | null;
};

export class MissionUpdateMapper {
  static toDomain(record: MissionUpdateWithPoint): MissionUpdate {
    const pointValue = record.pointValue
      ? PointValue.create({
        points: record.pointValue.points,
        label: record.pointValue.label ?? "",
      })
      : null;

    return MissionUpdate.restore({
      updateId: record.update_id,
      publicId: record.public_id,
      missionId: record.mission_id,
      userId: record.user_id,
      comment: record.comment,
      photoUrl: record.photo_url,
      status: record.status,
      createdAt: record.created_at,
      pointValue: pointValue
    });
  }


  static toPersistence(
    update: MissionUpdate,
    pointValueId?: number
  ): Prisma.MissionUpdateUncheckedCreateInput {
    return {
      public_id: update.publicId,
      mission_id: update.missionId,
      user_id: update.userId,
      comment: update.comment,
      photo_url: update.photoUrl,
      status: update.status,
      created_at: update.createdAt,
      point_value_id: pointValueId,
      scored_at: update.pointValue ? new Date() : null,
    };
  }

}
