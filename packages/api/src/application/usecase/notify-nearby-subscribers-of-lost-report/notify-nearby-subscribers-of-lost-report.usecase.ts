import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { PushNotification } from "@domain/services/IPushSender";
import { ReportType } from "@domain/report/types/report.type";
import { GeoPoint, haversineKm } from "@domain/shared/geo/haversine";
import type { CreateLostNearbyNotificationUseCase } from "@application/usecase/create-lost-nearby-notification/create-lost-nearby-notification.usecase";
import { CreateLostNearbyNotificationInput } from "@application/usecase/create-lost-nearby-notification/create-lost-nearby-notification.input";
import type { SendPushToUserUseCase } from "@application/usecase/send-push-to-user/send-push-to-user.usecase";
import { SendPushToUserInput } from "@application/usecase/send-push-to-user/send-push-to-user.input";
import { inject, injectable } from "tsyringe";

@injectable()
export class NotifyNearbySubscribersOfLostReportUseCase {
  constructor(
    @inject("ReportRepository")
    private readonly reportRepository: ReportRepository,

    @inject("UserRepository")
    private readonly userRepository: IUserRepository,

    @inject("CreateLostNearbyNotificationUseCase")
    private readonly createLostNearbyNotificationUseCase: CreateLostNearbyNotificationUseCase,

    @inject("SendPushToUserUseCase")
    private readonly sendPushToUserUseCase: SendPushToUserUseCase,
  ) {}

async execute(reportPublicId: string): Promise<void> {
  console.log("=== LOST NOTIFICATIONS ===");
  console.log("Report:", reportPublicId);

  const subscribers = await this.eligibleSubscribers(reportPublicId);

  console.log("Subscribers:", subscribers);

  if (subscribers.length === 0) {
    console.log("No eligible subscribers");
    return;
  }

  await this.notifySubscribers(subscribers, reportPublicId);
}

private async eligibleSubscribers(
reportPublicId: string,
): Promise<string[]> {
const report = await this.reportRepository.findByPublicId(reportPublicId);

if (!report || report.reportType !== ReportType.LOST) {
  return [];
}

const reportLocation = this.toPoint(
  report.location.latitude,
  report.location.longitude,
);

const candidates =
  await this.userRepository.findNotificationCandidates();
console.log("Candidates:", candidates);
const now = new Date();

for (const candidate of candidates) {
  console.log("Checking:", candidate.publicId, {
    role: candidate.role,
    lostReportsEnabled: candidate.lostReportsEnabled,
    lat: candidate.lastKnownLatitude,
    lng: candidate.lastKnownLongitude,
    radius: candidate.notificationRadius,
    mutedUntil: candidate.mutedUntil,
  });
}

return candidates
  .filter((candidate) => {
    if (candidate.publicId === report.userPublicId) {
      return false;
    }

    if (candidate.role.trim().toUpperCase() === "ADMIN") {
      return false;
    }

    if (!candidate.lostReportsEnabled) {
      return false;
    }

    if (
      candidate.mutedUntil !== null &&
      candidate.mutedUntil > now
    ) {
      return false;
    }

    if (
      candidate.lastKnownLatitude === null ||
      candidate.lastKnownLongitude === null
    ) {
      return false;
    }

    const subscriberLocation = this.toPoint(
      candidate.lastKnownLatitude,
      candidate.lastKnownLongitude,
    );

    const distanceKm = haversineKm(
      reportLocation,
      subscriberLocation,
    );

    return distanceKm <= candidate.notificationRadius;
  })
  .map((candidate) => candidate.publicId);

}

private async notifySubscribers(
  subscribers: string[],
  reportPublicId: string,
): Promise<void> {
  const report = await this.reportRepository.findDetailByPublicId(
    reportPublicId,
  );

  if (!report) {
    return;
  }

  const notification = this.buildNotification(reportPublicId);

  await Promise.all(
    subscribers.map(async (subscriberPublicId) => {
      const user = await this.userRepository.findByPublicId(
        subscriberPublicId,
      );

      if (!user) {
        return;
      }

      await this.createLostNearbyNotificationUseCase.execute(
        new CreateLostNearbyNotificationInput(
            user.internalId!,
            user.id,
            reportPublicId,
            report.pet?.name ?? null,
            report.pet?.images[0]?.photoUrl ?? null,
            report.report.location.address,
            notification.title,
            notification.body,
        ),
      );

      await this.sendPushToUserUseCase.execute(
        new SendPushToUserInput(
          subscriberPublicId,
          notification,
        ),
      );
    }),
  );
}

private buildNotification(
    reportPublicId: string,
    ): PushNotification {
    return {
        title: "¡Mascota perdida cerca tuyo!",
        body: "Se reportó una mascota perdida en tu zona. Tu ayuda puede hacer la diferencia.",
        data: {
        reportPublicId,
        reportType: ReportType.LOST,
        },
    };
}

private toPoint(
latitude: number,
longitude: number,
): GeoPoint {
return {
latitude,
longitude,
};
}
}