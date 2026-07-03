import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { ReportFollowerRepository } from "@domain/report/repositories/report-follower.repository";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { UserExpAction } from "@domain/entities/UserExpAction";
import { AwardUserExpInput } from "@application/usecase/award-user-exp/award-user-exp.input";
import type { AwardUserExpUseCase } from "@application/usecase/award-user-exp/award-user-exp.usecase";
import { inject, injectable } from "tsyringe";

interface FollowReportInput {
  userPublicId: string;
  reportPublicId: string;
}

@injectable()
export class FollowReportUseCase {
  constructor(
    @inject("ReportRepository")
    private readonly reportRepository: ReportRepository,
    @inject("ReportFollowerRepository")
    private readonly followerRepository: ReportFollowerRepository,
    @inject("AwardUserExpUseCase")
    private readonly awardUserExpUseCase?: AwardUserExpUseCase,
  ) {}

  async execute(input: FollowReportInput): Promise<void> {
    const report = await this.reportRepository.findByPublicId(
      input.reportPublicId,
    );

    if (!report) {
      throw new ReportNotFoundError(input.reportPublicId);
    }

    await this.followerRepository.follow(
      input.userPublicId,
      input.reportPublicId,
    );

    await this.awardUserExpUseCase?.execute(
      new AwardUserExpInput(input.userPublicId, UserExpAction.FOLLOW_REPORT),
    );
  }
}
