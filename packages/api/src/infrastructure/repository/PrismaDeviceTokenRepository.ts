import { IDeviceTokenRepository } from "../../domain/repositories/IDeviceTokenRepository";
import prisma from "../prisma/prisma.client";

export class PrismaDeviceTokenRepository implements IDeviceTokenRepository {
    async registerForUser(userPublicId: string, token: string): Promise<void> {
        const user = await prisma.user.findUniqueOrThrow({
            where: { public_id: userPublicId },
            select: { user_id: true },
        });

        await prisma.deviceToken.upsert({
            where: { token },
            update: { user_id: user.user_id },
            create: { user_id: user.user_id, token },
        });
    }

    async removeForUser(userPublicId: string, token: string): Promise<void> {
        const user = await prisma.user.findUniqueOrThrow({
            where: { public_id: userPublicId },
            select: { user_id: true },
        });

        await prisma.deviceToken.deleteMany({
            where: { token, user_id: user.user_id },
        });
    }

    async findTokensByUser(userPublicId: string): Promise<string[]> {
        const records = await prisma.deviceToken.findMany({
            where: { user: { public_id: userPublicId } },
            select: { token: true },
        });
        return records.map((record) => record.token);
    }
}
