import { ReportFollowerRepository } from "@domain/report/repositories/report-follower.repository";

interface IsFollowingReportInput {
  userPublicId: string;
  reportPublicId: string;
}

export class IsFollowingReportUseCase {
  constructor(
    private readonly followerRepository: ReportFollowerRepository,
  ) {}

  async execute(input: IsFollowingReportInput): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.followerRepository.isFollowing(
      input.userPublicId,
      input.reportPublicId,
    );

    return { isFollowing };
  }
}