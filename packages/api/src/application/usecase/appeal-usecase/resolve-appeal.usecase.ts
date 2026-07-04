import { inject, injectable } from "tsyringe";
import { logger } from "@pet-alert/shared";
import type { AppealRepository } from "@domain/appeal/repositories/appeal.repository";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { ContentReportRepository } from "@domain/content-report/repositories/content-report.repository";
import { Appeal } from "@domain/appeal/Appeal";
import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";
import { AppealNotFoundError } from "@domain/appeal/errors/AppealNotFoundError";
import { ReportStatus } from "@domain/report/types/report.status";
import { ContentReportTargetType } from "@domain/content-report/types/content-report-target-type";
import { NotifyAppealResultUseCase } from "../notify-appeal-result/notify-appeal-result.usecase";
import { NotifyAppealResultInput } from "../notify-appeal-result/notify-appeal-result.input";
import { ResolveAppealInput } from "./resolve-appeal.input";

@injectable()
export class ResolveAppealUseCase {
    constructor(
        @inject("AppealRepository")
        private readonly appealRepository: AppealRepository,
        @inject("ReportRepository")
        private readonly reportRepository: ReportRepository,
        @inject("UserRepository")
        private readonly userRepository: IUserRepository,
        @inject("ContentReportRepository")
        private readonly contentReportRepository: ContentReportRepository,
        @inject("NotifyAppealResultUseCase")
        private readonly notifyAppealResult: NotifyAppealResultUseCase,
    ) { }

    async execute(input: ResolveAppealInput): Promise<void> {
        const appeal = await this.appealRepository.findByPublicId(input.publicId);
        if (!appeal) throw new AppealNotFoundError();

        this.applyDecision(appeal, input.accept);
        await this.appealRepository.update(appeal);
        if (input.accept) await this.revert(appeal);
        this.notifyResult(appeal, input.accept);
    }

    private applyDecision(appeal: Appeal, accept: boolean): void {
        if (accept) appeal.accept();
        else appeal.reject();
    }

    private async revert(appeal: Appeal): Promise<void> {
        if (appeal.targetType === AppealTargetType.POST) return this.reopenPublication(appeal.targetPublicId);
        return this.reopenAccount(appeal.targetPublicId);
    }

    private async reopenPublication(targetPublicId: string): Promise<void> {
        const report = await this.reportRepository.findByPublicId(targetPublicId);
        if (report && report.status === ReportStatus.CLOSED) {
            report.reopen();
            await this.reportRepository.update(report);
        }
        await this.contentReportRepository.dismissByTarget(ContentReportTargetType.POST, targetPublicId);
    }

    private async reopenAccount(userPublicId: string): Promise<void> {
        const user = await this.userRepository.findByPublicId(userPublicId);
        if (!user) return;
        const userId = user.requireInternalId();
        await this.userRepository.unsuspend(userId);
        await this.reportRepository.reopenModerationClosedByUserId(userId);
        const reportPublicIds = await this.reportRepository.findPublicIdsByUserId(userId);
        await this.contentReportRepository.dismissResolvedForUser(userPublicId, reportPublicIds);
    }

    private notifyResult(appeal: Appeal, accepted: boolean): void {
        void this.notifyAppealResult
            .execute(new NotifyAppealResultInput(appeal.appellantUserId, accepted, appeal.targetType))
            .catch((error) => logger.error("Failed to notify appeal result", { error }));
    }
}
