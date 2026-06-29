import { inject, injectable } from "tsyringe";
import type { ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";
import { ContentReportQueueItemOutput } from "./dto/content-report-queue.output";

@injectable()
export class GetContentReportQueueUseCase {
    constructor(
        @inject("ContentReportRepository")
        private contentReportRepository: ContentReportRepository,
    ) { }

    async execute(status: ContentReportStatus = ContentReportStatus.PENDING): Promise<ContentReportQueueItemOutput[]> {
        const items = await this.contentReportRepository.findQueueByStatus(status);

        return items.map(({ report, reporter, reportedUser, reportCount }) => ({
            publicId: report.publicId,
            targetType: report.targetType,
            targetPublicId: report.targetPublicId,
            reason: report.reason,
            status: report.status,
            description: report.description,
            autoFlagged: report.autoFlagged,
            createdAt: report.createdAt,
            reportCount,
            reportedUser,
            reporter: {
                publicId: reporter.publicId,
                username: reporter.username,
            },
        }));
    }
}
