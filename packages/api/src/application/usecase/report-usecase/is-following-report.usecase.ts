import type { ReportFollowerRepository } from "@domain/report/repositories/report-follower.repository";
import { inject, injectable } from "tsyringe";

interface IsFollowingReportInput {
  userPublicId: string;
  reportPublicId: string;
}

@injectable()
export class IsFollowingReportUseCase {
  constructor(
    @inject("ReportFollowerRepository")
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