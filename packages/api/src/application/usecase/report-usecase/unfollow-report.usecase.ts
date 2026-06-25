import type { ReportFollowerRepository } from "@domain/report/repositories/report-follower.repository";
import { inject, injectable } from "tsyringe";

interface UnfollowReportInput {
  userPublicId: string;
  reportPublicId: string;
}

@injectable()
export class UnfollowReportUseCase {
  constructor(
    @inject("ReportFollowerRepository")
    private readonly followerRepository: ReportFollowerRepository,
  ) {}

  async execute(input: UnfollowReportInput): Promise<void> {
    await this.followerRepository.unfollow(
      input.userPublicId,
      input.reportPublicId,
    );
  }
}