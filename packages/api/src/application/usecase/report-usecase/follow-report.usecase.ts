import { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportFollowerRepository } from "@domain/report/repositories/report-follower.repository";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";

interface FollowReportInput {
  userPublicId: string;
  reportPublicId: string;
}

export class FollowReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly followerRepository: ReportFollowerRepository,
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
  }
}