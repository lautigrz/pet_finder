import { inject, injectable } from "tsyringe";
import { randomUUID } from "node:crypto";
import { ContentReport } from "@domain/content-report/ContentReport";
import type { ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import { AUTO_FLAG_THRESHOLD } from "@domain/content-report/content-report.constants";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { CannotReportOwnContentError } from "@domain/content-report/errors/CannotReportOwnContentError";
import { NotChatParticipantError } from "@domain/content-report/errors/NotChatParticipantError";
import { ContentAlreadyReportedError } from "@domain/content-report/errors/ContentAlreadyReportedError";
import { ReportedContentNotFoundError } from "@domain/content-report/errors/ReportedContentNotFoundError";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { ConversationRepository } from "@domain/conversation/repositories/conversation.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import { CreateContentReportDTO } from "./dto/create-content-report.dto";

export interface CreateContentReportResult {
    publicId: string;
    autoFlagged: boolean;
}

@injectable()
export class CreateContentReportUseCase {
    constructor(
        @inject("ContentReportRepository")
        private contentReportRepository: ContentReportRepository,
        @inject("UserRepository")
        private userRepository: IUserRepository,
        @inject("ReportRepository")
        private reportRepository: ReportRepository,
        @inject("ConversationRepository")
        private conversationRepository: ConversationRepository,
    ) { }

    async execute(dto: CreateContentReportDTO, reporterPublicId: string): Promise<CreateContentReportResult> {
        const reporter = await this.userRepository.findByPublicId(reporterPublicId);
        if (!reporter) throw new UserNotFoundError();

        const reporterUserId = reporter.internalId!;

        await this.assertReportableTarget(dto.targetType, dto.targetPublicId, reporterUserId);

        const existing = await this.contentReportRepository.findByReporterAndTarget(
            reporterUserId,
            dto.targetType,
            dto.targetPublicId,
        );
        if (existing) throw new ContentAlreadyReportedError();

        const report = ContentReport.create({
            publicId: randomUUID(),
            reporterUserId,
            targetType: dto.targetType,
            targetPublicId: dto.targetPublicId,
            reason: dto.reason,
            description: dto.description,
        });

        await this.contentReportRepository.save(report);

        const totalReports = await this.contentReportRepository.countByTarget(dto.targetType, dto.targetPublicId);
        const autoFlagged = totalReports >= AUTO_FLAG_THRESHOLD;
        if (autoFlagged) {
            await this.contentReportRepository.flagTarget(dto.targetType, dto.targetPublicId);
        }

        return { publicId: report.publicId, autoFlagged };
    }

    private async assertReportableTarget(
        targetType: ContentReportTargetType,
        targetPublicId: string,
        reporterUserId: number,
    ): Promise<void> {
        if (targetType === ContentReportTargetType.POST) {
            const report = await this.reportRepository.findByPublicId(targetPublicId);
            if (!report) throw new ReportedContentNotFoundError();
            if (report.userId === reporterUserId) throw new CannotReportOwnContentError();
            return;
        }

        const conversation = await this.conversationRepository.findByPublicId(targetPublicId);
        if (!conversation) throw new ReportedContentNotFoundError();
        if (!conversation.hasParticipant(reporterUserId)) throw new NotChatParticipantError();
    }
}
