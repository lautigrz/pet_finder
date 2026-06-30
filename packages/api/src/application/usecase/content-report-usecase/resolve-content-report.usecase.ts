import { inject, injectable } from "tsyringe";
import type { ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { ContentReportNotFoundError } from "@domain/content-report/errors/ContentReportNotFoundError";
import { SuspensionReasonRequiredError } from "@domain/content-report/errors/SuspensionReasonRequiredError";
import { ReportedContentNotFoundError } from "@domain/content-report/errors/ReportedContentNotFoundError";
import { ResolveContentReportDTO } from "./dto/resolve-content-report.dto";

@injectable()
export class ResolveContentReportUseCase {
    constructor(
        @inject("ContentReportRepository")
        private contentReportRepository: ContentReportRepository,
        @inject("ReportRepository")
        private reportRepository: ReportRepository,
    ) { }

    async execute(dto: ResolveContentReportDTO): Promise<void> {
        const contentReport = await this.contentReportRepository.findByPublicId(dto.publicId);
        if (!contentReport) throw new ContentReportNotFoundError();

        if (dto.status === ContentReportStatus.REVIEWED) {
            contentReport.approve();
        } else if (dto.status === ContentReportStatus.DISMISSED) {
            contentReport.dismiss();
        } else if (dto.status === ContentReportStatus.PENDING) {
            contentReport.markPending();
        } else if (dto.status === ContentReportStatus.SUSPENDED) {
            const reason = dto.suspensionReason?.trim();
            if (!reason) throw new SuspensionReasonRequiredError();
            await this.suspendReportedContent(contentReport.targetType, contentReport.targetPublicId);
            contentReport.suspend(reason);
        }

        await this.contentReportRepository.update(contentReport);
    }

    private async suspendReportedContent(
        targetType: ContentReportTargetType,
        targetPublicId: string,
    ): Promise<void> {
        if (targetType !== ContentReportTargetType.POST) return;

        const report = await this.reportRepository.findByPublicId(targetPublicId);
        if (!report) throw new ReportedContentNotFoundError();

        report.suspend();
        await this.reportRepository.update(report);
    }
}
