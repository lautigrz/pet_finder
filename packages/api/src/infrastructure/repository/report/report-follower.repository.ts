import { Prisma, PrismaClient } from "@prisma/client";
import { ReportFollowerRepository } from "@domain/report/repositories/report-follower.repository";
import { inject, injectable } from "tsyringe";


@injectable()
export class PrismaReportFollowerRepository implements ReportFollowerRepository {

    constructor(
        @inject("PrismaClient")
        private readonly prisma: PrismaClient) { }

    async follow(userPublicId: string, reportPublicId: string): Promise<void> {
        try {
            await this.prisma.reportFollower.create({
                data: {
                    user: {
                        connect: {
                            public_id: userPublicId
                        }
                    },
                    report: {
                        connect: {
                            public_id: reportPublicId
                        },
                    },
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return;
            }
            throw error;
        }
    }

    async unfollow(userPublicId: string, reportPublicId: string): Promise<void> {
        await this.prisma.reportFollower.deleteMany({
            where: {
                user: {
                    public_id: userPublicId,
                },
                report: {
                    public_id: reportPublicId,
                },
            },
        });
    }

    async isFollowing(
        userPublicId: string,
        reportPublicId: string,
    ): Promise<boolean> {
        const count = await this.prisma.reportFollower.count({
            where: {
                user: {
                    public_id: userPublicId,
                },
                report: {
                    public_id: reportPublicId,
                },
            },
        });

        return count > 0;
    }

    async findFollowerPublicIdsByReportPublicId(
        reportPublicId: string,
    ): Promise<string[]> {
        const followers = await this.prisma.reportFollower.findMany({
            where: {
                report: {
                    public_id: reportPublicId,
                },
            },
            select: {
                user: {
                    select: {
                        public_id: true,
                    },
                },
            },
        });

        return followers.map((follower) => follower.user.public_id);
    }
}