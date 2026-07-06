import { Appeal } from "@domain/appeal/Appeal";
import { appealStatusMap, appealStatusMapReverse } from "@domain/appeal/types/appeal-status";
import { appealTargetTypeMap, appealTargetTypeMapReverse } from "@domain/appeal/types/appeal-target-type";
import { Prisma } from "@prisma/client";

type PrismaAppeal = Prisma.AppealGetPayload<object>;

export class AppealMapper {

    static toPersistence(appeal: Appeal): Prisma.AppealCreateInput {
        return {
            public_id: appeal.publicId,
            target_public_id: appeal.targetPublicId,
            message: appeal.message,
            created_at: appeal.createdAt,
            resolved_at: appeal.resolvedAt,
            appellant: { connect: { user_id: appeal.appellantUserId } },
            targetType: { connect: { appeal_target_type_id: appealTargetTypeMap[appeal.targetType] } },
            status: { connect: { appeal_status_id: appealStatusMap[appeal.status] } },
        };
    }

    static toDomain(raw: PrismaAppeal): Appeal {
        return Appeal.restore({
            appealId: raw.appeal_id,
            publicId: raw.public_id,
            appellantUserId: raw.appellant_user_id,
            targetType: appealTargetTypeMapReverse[raw.target_type_id]!,
            targetPublicId: raw.target_public_id,
            message: raw.message,
            status: appealStatusMapReverse[raw.status_id]!,
            createdAt: raw.created_at,
            resolvedAt: raw.resolved_at,
        });
    }
}
