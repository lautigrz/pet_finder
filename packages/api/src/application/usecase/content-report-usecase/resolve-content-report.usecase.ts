import { inject, injectable } from "tsyringe";
import type { ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { ContentReportStatus } from "@domain/content-report/types/content-report-status";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { ContentReportNotFoundError } from "@domain/content-report/errors/ContentReportNotFoundError";
import { SuspensionReasonRequiredError } from "@domain/content-report/errors/SuspensionReasonRequiredError";
import { ReportedContentNotFoundError } from "@domain/content-report/errors/ReportedContentNotFoundError";
import { AUTO_SUSPEND_APPROVED_PUBLICATIONS_THRESHOLD } from "@domain/content-report/content-report.constants";
import { ReportStatus } from "@domain/report/types/report.status";
import { ResolveContentReportDTO } from "./dto/resolve-content-report.dto";
import { ResolveContentReportResult } from "./dto/resolve-content-report.output";
import { NotifyOwnerOfContentSentenceUseCase } from "../notify-owner-of-content-sentence/notify-owner-of-content-sentence.usecase";
import { NotifyOwnerOfContentSentenceInput } from "../notify-owner-of-content-sentence/notify-owner-of-content-sentence.input";
import { logger } from "@pet-alert/shared";

const AUTO_SUSPENSION_MOTIVE = "Acumulaste varias publicaciones dadas de baja por moderación.";

@injectable()
export class ResolveContentReportUseCase {
    constructor(
        @inject("ContentReportRepository")
        private contentReportRepository: ContentReportRepository,
        @inject("ReportRepository")
        private reportRepository: ReportRepository,
        @inject("ConversationRepository")
        private conversationRepository: ConversationRepository,
        @inject("UserRepository")
        private userRepository: IUserRepository,
        @inject("NotifyOwnerOfContentSentenceUseCase")
        private notifyOwnerOfContentSentence: NotifyOwnerOfContentSentenceUseCase,
    ) { }

    async execute(dto: ResolveContentReportDTO): Promise<ResolveContentReportResult> {
        const contentReport = await this.contentReportRepository.findByPublicId(dto.publicId);
        if (!contentReport) throw new ContentReportNotFoundError();

        if (dto.status === ContentReportStatus.REVIEWED) {
            contentReport.approve();
            await this.contentReportRepository.update(contentReport);
            if (contentReport.targetType === ContentReportTargetType.POST) {
                await this.hideReportedPublication(contentReport.targetPublicId);
                const approvedCount = await this.contentReportRepository.approveOpenByTarget(
                    contentReport.targetType,
                    contentReport.targetPublicId,
                );
                const { userId, userPublicId } = await this.resolveReportedUser(
                    contentReport.targetType,
                    contentReport.targetPublicId,
                );
                const suspendedCount = await this.autoSuspendAuthorIfManyApproved(userId, userPublicId);
                this.notifyPostSentence(userPublicId, contentReport.targetPublicId, suspendedCount);
                return { autoSuspended: suspendedCount > 0, approvedCount, suspendedCount };
            }
            return { autoSuspended: false, approvedCount: 0, suspendedCount: 0 };
        }

        if (dto.status === ContentReportStatus.SUSPENDED) {
            const motive = dto.suspensionReason?.trim();
            if (!motive) throw new SuspensionReasonRequiredError();

            if (contentReport.targetType === ContentReportTargetType.CHAT) {
                await this.suspendReportedChat(contentReport.targetPublicId);
                const reason = `Suspensión manual: un administrador suspendió el chat. Motivo: ${motive}`;
                const suspendedCount = await this.contentReportRepository.suspendOpenByTarget(
                    ContentReportTargetType.CHAT,
                    contentReport.targetPublicId,
                    reason,
                );
                return { autoSuspended: false, approvedCount: 0, suspendedCount };
            }

            const reason = `Suspensión manual: se suspendió el perfil del usuario. Motivo: ${motive}`;
            const { suspendedCount, userPublicId } = await this.suspendReportedUser(
                contentReport.targetType,
                contentReport.targetPublicId,
                reason,
            );
            this.dispatchNotification(new NotifyOwnerOfContentSentenceInput(userPublicId, "ACCOUNT_SUSPENDED", userPublicId, motive));
            return { autoSuspended: false, approvedCount: 0, suspendedCount };
        }

        if (dto.status === ContentReportStatus.DISMISSED) {
            contentReport.dismiss();
        } else if (dto.status === ContentReportStatus.PENDING) {
            contentReport.markPending();
        }

        await this.contentReportRepository.update(contentReport);
        return { autoSuspended: false, approvedCount: 0, suspendedCount: 0 };
    }

    private async hideReportedPublication(targetPublicId: string): Promise<void> {
        const report = await this.reportRepository.findByPublicId(targetPublicId);
        if (!report) throw new ReportedContentNotFoundError();
        if (report.status === ReportStatus.CLOSED) return;

        report.suspend();
        await this.reportRepository.update(report);
    }

    private async autoSuspendAuthorIfManyApproved(userId: number, userPublicId: string): Promise<number> {
        const reportPublicIds = await this.reportRepository.findPublicIdsByUserId(userId);
        const approvedPublications = await this.contentReportRepository.countDistinctApprovedPublications(reportPublicIds);
        if (approvedPublications < AUTO_SUSPEND_APPROVED_PUBLICATIONS_THRESHOLD) return 0;

        const author = await this.userRepository.findById(userId);
        if (!author || author.isSuspended) return 0;

        await this.userRepository.markSuspended(userId);
        await this.reportRepository.closeAllByUserId(userId);

        const reason = `Suspensión automática: el usuario alcanzó ${AUTO_SUSPEND_APPROVED_PUBLICATIONS_THRESHOLD} publicaciones aprobadas por moderación.`;
        return this.contentReportRepository.suspendOpenForUser(userPublicId, reportPublicIds, reason);
    }

    private async suspendReportedChat(targetPublicId: string): Promise<void> {
        const conversation = await this.conversationRepository.findByPublicId(targetPublicId);
        if (!conversation) throw new ReportedContentNotFoundError();
        if (conversation.isSuspended) return;

        conversation.suspend();
        await this.conversationRepository.update(conversation);
    }

    private async suspendReportedUser(
        targetType: ContentReportTargetType,
        targetPublicId: string,
        reason: string,
    ): Promise<{ suspendedCount: number; userPublicId: string }> {
        const { userId, userPublicId } = await this.resolveReportedUser(targetType, targetPublicId);

        await this.userRepository.markSuspended(userId);
        await this.reportRepository.closeAllByUserId(userId);

        const reportPublicIds = await this.reportRepository.findPublicIdsByUserId(userId);
        const suspendedCount = await this.contentReportRepository.suspendOpenForUser(userPublicId, reportPublicIds, reason);
        return { suspendedCount, userPublicId };
    }

    private notifyPostSentence(userPublicId: string, postPublicId: string, suspendedCount: number): void {
        const input = suspendedCount > 0
            ? new NotifyOwnerOfContentSentenceInput(userPublicId, "ACCOUNT_SUSPENDED", userPublicId, AUTO_SUSPENSION_MOTIVE)
            : new NotifyOwnerOfContentSentenceInput(userPublicId, "PUBLICATION_REMOVED", postPublicId);
        this.dispatchNotification(input);
    }

    private dispatchNotification(input: NotifyOwnerOfContentSentenceInput): void {
        void this.notifyOwnerOfContentSentence
            .execute(input)
            .catch((error) => logger.error("Failed to notify owner of content sentence", { error }));
    }

    private async resolveReportedUser(
        targetType: ContentReportTargetType,
        targetPublicId: string,
    ): Promise<{ userId: number; userPublicId: string }> {
        if (targetType === ContentReportTargetType.POST) {
            const report = await this.reportRepository.findByPublicId(targetPublicId);
            if (!report) throw new ReportedContentNotFoundError();
            return { userId: report.userId, userPublicId: report.userPublicId };
        }

        const user = await this.userRepository.findByPublicId(targetPublicId);
        if (!user) throw new ReportedContentNotFoundError();
        return { userId: user.requireInternalId(), userPublicId: user.id };
    }
}
