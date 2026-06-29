import type { ReportFollowerRepository } from "@domain/report/repositories/report-follower.repository";
import { ReportStatus } from "@domain/report/types/report.status";
import { PushNotification } from "@domain/services/IPushSender";
import { SendPushToUserUseCase } from "@application/usecase/send-push-to-user/send-push-to-user.usecase";
import { SendPushToUserInput } from "@application/usecase/send-push-to-user/send-push-to-user.input";
import { inject, injectable } from "tsyringe";

interface NotifyReportFollowersInput {
  reportPublicId: string;
  ownerPublicId: string;
  status: ReportStatus;
}

@injectable()
export class NotifyReportFollowersOfStatusChangeUseCase {
  constructor(
    @inject("ReportFollowerRepository")
    private readonly followerRepository: ReportFollowerRepository,
    @inject("SendPushToUserUseCase")
    private readonly sendPushToUser: SendPushToUserUseCase,
  ) {}

  async execute(input: NotifyReportFollowersInput): Promise<void> {
    const followerPublicIds =
      await this.followerRepository.findFollowerPublicIdsByReportPublicId(
        input.reportPublicId,
      );

    const usersToNotify = followerPublicIds.filter(
      (publicId) => publicId !== input.ownerPublicId,
    );

    await Promise.allSettled(
      usersToNotify.map((userPublicId) =>
        this.sendPushToUser.execute(
          new SendPushToUserInput(
            userPublicId,
            this.buildPush(input),
          ),
        ),
      ),
    );
  }

  private buildPush(input: NotifyReportFollowersInput): PushNotification {
    if (input.status === ReportStatus.RESOLVED) {
      return {
        title: "¡Caso resuelto! 🐾",
        body: "Un reporte que seguías fue marcado como resuelto.",
        data: {
          reportId: input.reportPublicId,
          type: "REPORT_RESOLVED",
        },
      };
    }

    return {
      title: "Reporte cerrado",
      body: "Un reporte que seguías fue cerrado.",
      data: {
        reportId: input.reportPublicId,
        type: "REPORT_CLOSED",
      },
    };
  }
}