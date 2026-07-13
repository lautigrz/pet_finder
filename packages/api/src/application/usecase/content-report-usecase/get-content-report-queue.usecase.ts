import { inject, injectable } from "tsyringe";
import type { ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";
import { ContentReportQueueItemOutput } from "./dto/content-report-queue.output";

const XP_PER_LEVEL = 100;

@injectable()
export class GetContentReportQueueUseCase {
    constructor(
        @inject("ContentReportRepository")
        private contentReportRepository: ContentReportRepository,
    ) { }

    async execute(status: ContentReportStatus = ContentReportStatus.PENDING): Promise<ContentReportQueueItemOutput[]> {
        const items = await this.contentReportRepository.findQueueByStatus(status);

        return items.map(({ report, reporter, reportedUser, reportedContent, reportCount }) => ({
            publicId: report.publicId,
            targetType: report.targetType,
            targetPublicId: report.targetPublicId,
            reason: report.reason,
            status: report.status,
            description: report.description,
            suspensionReason: report.suspensionReason,
            autoFlagged: report.autoFlagged,
            createdAt: report.createdAt,
            reportCount,
            reportedUser: reportedUser
                ? {
                    username: reportedUser.username,
                    publicId: reportedUser.publicId,
                    xp: reportedUser.xp,
                    level: Math.floor(reportedUser.xp / XP_PER_LEVEL) + 1,
                    rating: reportedUser.rating,
                }
                : null,
            reportedContent,
            reporter: {
                publicId: reporter.publicId,
                username: reporter.username,
            },
        }));
    }
}
