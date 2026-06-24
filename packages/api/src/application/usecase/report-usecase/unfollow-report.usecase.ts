import { ReportFollowerRepository } from "@domain/report/repositories/report-follower.repository";

interface UnfollowReportInput {
  userPublicId: string;
  reportPublicId: string;
}

export class UnfollowReportUseCase {
  constructor(
    private readonly followerRepository: ReportFollowerRepository,
  ) {}

  async execute(input: UnfollowReportInput): Promise<void> {
    await this.followerRepository.unfollow(
      input.userPublicId,
      input.reportPublicId,
    );
  }
}