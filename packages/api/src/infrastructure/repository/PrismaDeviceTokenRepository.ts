import { PrismaClient } from "@prisma/client";
import { IDeviceTokenRepository } from "../../domain/repositories/IDeviceTokenRepository";
import { inject, injectable } from "tsyringe";

@injectable()
export class PrismaDeviceTokenRepository implements IDeviceTokenRepository {

    constructor(
        @inject("PrismaClient")
        private readonly prisma: PrismaClient) { }

    async registerForUser(userPublicId: string, token: string): Promise<void> {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { public_id: userPublicId },
            select: { user_id: true },
        });

        await this.prisma.deviceToken.upsert({
            where: { token },
            update: { user_id: user.user_id },
            create: { user_id: user.user_id, token },
        });
    }

    async removeForUser(userPublicId: string, token: string): Promise<void> {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { public_id: userPublicId },
            select: { user_id: true },
        });

        await this.prisma.deviceToken.deleteMany({
            where: { token, user_id: user.user_id },
        });
    }

    async findTokensByUser(userPublicId: string): Promise<string[]> {
        const records = await this.prisma.deviceToken.findMany({
            where: { user: { public_id: userPublicId } },
            select: { token: true },
        });
        return records.map((record) => record.token);
    }

    async deleteByTokens(tokens: string[]): Promise<void> {
        await this.prisma.deviceToken.deleteMany({ where: { token: { in: tokens } } });
    }
}
