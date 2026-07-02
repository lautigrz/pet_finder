import { inject, injectable } from "tsyringe";
import type { ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { ContentReportNotFoundError } from "@domain/content-report/errors/ContentReportNotFoundError";
import { SuspensionReasonRequiredError } from "@domain/content-report/errors/SuspensionReasonRequiredError";
import { ReportedContentNotFoundError } from "@domain/content-report/errors/ReportedContentNotFoundError";
import { AUTO_SUSPEND_APPROVED_THRESHOLD } from "@domain/content-report/content-report.constants";
import { ReportStatus } from "@domain/report/types/report.status";
import { ResolveContentReportDTO } from "./dto/resolve-content-report.dto";
import { ResolveContentReportResult } from "./dto/resolve-content-report.output";

@injectable()
export class ResolveContentReportUseCase {
    constructor(
        @inject("ContentReportRepository")
        private contentReportRepository: ContentReportRepository,
        @inject("ReportRepository")
        private reportRepository: ReportRepository,
        @inject("ConversationRepository")
        private conversationRepository: ConversationRepository,
    ) { }

    async execute(dto: ResolveContentReportDTO): Promise<ResolveContentReportResult> {
        const contentReport = await this.contentReportRepository.findByPublicId(dto.publicId);
        if (!contentReport) throw new ContentReportNotFoundError();

        if (dto.status === ContentReportStatus.REVIEWED) {
            contentReport.approve();
            await this.contentReportRepository.update(contentReport);
            const autoSuspended = await this.autoSuspendIfApprovedThresholdReached(
                contentReport.targetType,
                contentReport.targetPublicId,
            );
            return { autoSuspended };
        }

        if (dto.status === ContentReportStatus.SUSPENDED) {
            const motive = dto.suspensionReason?.trim();
            if (!motive) throw new SuspensionReasonRequiredError();
            await this.suspendReportedContent(contentReport.targetType, contentReport.targetPublicId);
            const contentLabel = contentReport.targetType === ContentReportTargetType.CHAT ? "el chat" : "la publicación";
            const reason = `Suspensión manual: un administrador suspendió ${contentLabel}. Motivo: ${motive}`;
            await this.contentReportRepository.suspendOpenByTarget(
                contentReport.targetType,
                contentReport.targetPublicId,
                reason,
            );
            return { autoSuspended: false };
        }

        if (dto.status === ContentReportStatus.DISMISSED) {
            contentReport.dismiss();
        } else if (dto.status === ContentReportStatus.PENDING) {
            contentReport.markPending();
        }

        await this.contentReportRepository.update(contentReport);
        return { autoSuspended: false };
    }

    private async autoSuspendIfApprovedThresholdReached(
        targetType: ContentReportTargetType,
        targetPublicId: string,
    ): Promise<boolean> {
        if (targetType !== ContentReportTargetType.POST) return false;

        const report = await this.reportRepository.findByPublicId(targetPublicId);
        if (!report) throw new ReportedContentNotFoundError();

        const alreadySuspended = report.status === ReportStatus.CLOSED;

        if (!alreadySuspended) {
            const approvedCount = await this.contentReportRepository.countApprovedByTarget(
                targetType,
                targetPublicId,
            );
            if (approvedCount < AUTO_SUSPEND_APPROVED_THRESHOLD) return false;

            report.suspend();
            await this.reportRepository.update(report);
        }

        const reason = `Suspensión automática: la publicación alcanzó ${AUTO_SUSPEND_APPROVED_THRESHOLD} denuncias aprobadas.`;
        await this.contentReportRepository.suspendOpenByTarget(targetType, targetPublicId, reason);

        return !alreadySuspended;
    }

    private async suspendReportedContent(
        targetType: ContentReportTargetType,
        targetPublicId: string,
    ): Promise<void> {
        if (targetType === ContentReportTargetType.POST) {
            const report = await this.reportRepository.findByPublicId(targetPublicId);
            if (!report) throw new ReportedContentNotFoundError();
            if (report.status === ReportStatus.CLOSED) return;

            report.suspend();
            await this.reportRepository.update(report);
            return;
        }

        if (targetType === ContentReportTargetType.CHAT) {
            const conversation = await this.conversationRepository.findByPublicId(targetPublicId);
            if (!conversation) throw new ReportedContentNotFoundError();
            if (conversation.isSuspended) return;

            conversation.suspend();
            await this.conversationRepository.update(conversation);
        }
    }
}
