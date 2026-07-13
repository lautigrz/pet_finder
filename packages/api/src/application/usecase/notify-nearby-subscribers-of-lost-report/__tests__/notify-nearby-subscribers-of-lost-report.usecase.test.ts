import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotifyNearbySubscribersOfLostReportUseCase } from "../notify-nearby-subscribers-of-lost-report.usecase";
import type { CreateLostNearbyNotificationUseCase } from "@application/usecase/create-lost-nearby-notification/create-lost-nearby-notification.usecase";
import type { SendPushToUserUseCase } from "@application/usecase/send-push-to-user/send-push-to-user.usecase";
import type { ReportRepository } from "@domain/report/repositories/report.repository";
import type {
  IUserRepository,
  UserNotificationTarget,
} from "@domain/repositories/IUserRepository";
import { ReportType } from "@domain/report/types/report.type";

interface LostReportStub {
  reportType: ReportType;
  userPublicId: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface ReportDetailStub {
  report: {
    location: {
      address: string;
    };
  };
  pet: {
    name: string;
    images: {
      photoUrl: string;
    }[];
  };
}

function candidate(
  overrides: Partial<UserNotificationTarget> = {},
): UserNotificationTarget {
  return {
    publicId: "user-1",
    role: "USER",
    lastKnownLatitude: -34.6037,
    lastKnownLongitude: -58.3816,
    lastKnownLocationAt: new Date(),
    notificationRadius: 5,
    lostReportsEnabled: true,
    mutedUntil: null,
    ...overrides,
  };
}

function lostReport(overrides: Partial<LostReportStub> = {}): LostReportStub {
  return {
    reportType: ReportType.LOST,
    userPublicId: "owner-1",
    location: {
      latitude: -34.6037,
      longitude: -58.3816,
    },
    ...overrides,
  };
}

function reportDetail(
  overrides: Partial<ReportDetailStub> = {},
): ReportDetailStub {
  return {
    report: {
      location: {
        address: "Av. Corrientes 1234",
      },
    },
    pet: {
      name: "Firulais",
      images: [],
    },
    ...overrides,
  };
}

describe("NotifyNearbySubscribersOfLostReportUseCase", () => {
  let reportRepository: ReportRepository;
  let userRepository: IUserRepository;
  let createLostNearbyNotificationUseCase: CreateLostNearbyNotificationUseCase;
  let sendPushToUserUseCase: SendPushToUserUseCase;
  let useCase: NotifyNearbySubscribersOfLostReportUseCase;

  beforeEach(() => {
    reportRepository = {
      findByPublicId: vi.fn(),
      findDetailByPublicId: vi.fn(),
    } as unknown as ReportRepository;

    userRepository = {
      findNotificationCandidates: vi.fn(),
      findByPublicId: vi.fn(),
    } as unknown as IUserRepository;

    createLostNearbyNotificationUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as CreateLostNearbyNotificationUseCase;

    sendPushToUserUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as SendPushToUserUseCase;

    useCase = new NotifyNearbySubscribersOfLostReportUseCase(
      reportRepository,
      userRepository,
      createLostNearbyNotificationUseCase,
      sendPushToUserUseCase,
    );
  });

  describe("execute", () => {
    it("returns without notifying when the report does not exist", async () => {
      // Given
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(null);

      // When
      await useCase.execute("report-1");

      // Then
      expect(userRepository.findNotificationCandidates).not.toHaveBeenCalled();

      expect(
        createLostNearbyNotificationUseCase.execute,
      ).not.toHaveBeenCalled();

      expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
    });

    it("returns without notifying when the report is not LOST", async () => {
      // Given
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue({
        reportType: ReportType.SIGHTING,
      } as never);

      // When
      await useCase.execute("report-1");

      // Then
      expect(userRepository.findNotificationCandidates).not.toHaveBeenCalled();

      expect(
        createLostNearbyNotificationUseCase.execute,
      ).not.toHaveBeenCalled();

      expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("eligible subscribers", () => {
    it("notifies every eligible subscriber", async () => {
      // Given
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(
        lostReport() as never,
      );

      vi.mocked(reportRepository.findDetailByPublicId).mockResolvedValue(
        reportDetail() as never,
      );

      vi.mocked(userRepository.findNotificationCandidates).mockResolvedValue([
        candidate(),
      ]);

      vi.mocked(userRepository.findByPublicId).mockResolvedValue({
        internalId: 10,
        id: "user-1",
      } as never);

      // When
      await useCase.execute("report-1");

      // Then
      expect(
        createLostNearbyNotificationUseCase.execute,
      ).toHaveBeenCalledOnce();

      expect(sendPushToUserUseCase.execute).toHaveBeenCalledOnce();
    });
  });

  describe("subscriber filtering", () => {
    beforeEach(() => {
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(
        lostReport() as never,
      );

      vi.mocked(reportRepository.findDetailByPublicId).mockResolvedValue(
        reportDetail() as never,
      );
    });

    it("ignores the report owner", async () => {
      // Given
      vi.mocked(userRepository.findNotificationCandidates).mockResolvedValue([
        candidate({
          publicId: "owner-1",
        }),
      ]);

      // When
      await useCase.execute("report-1");

      // Then
      expect(
        createLostNearbyNotificationUseCase.execute,
      ).not.toHaveBeenCalled();

      expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
    });

    it("ignores administrators", async () => {
      // Given
      vi.mocked(userRepository.findNotificationCandidates).mockResolvedValue([
        candidate({
          role: "ADMIN",
        }),
      ]);

      // When
      await useCase.execute("report-1");

      // Then
      expect(
        createLostNearbyNotificationUseCase.execute,
      ).not.toHaveBeenCalled();

      expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
    });

    it("ignores users with lost notifications disabled", async () => {
      // Given
      vi.mocked(userRepository.findNotificationCandidates).mockResolvedValue([
        candidate({
          lostReportsEnabled: false,
        }),
      ]);

      // When
      await useCase.execute("report-1");

      // Then
      expect(
        createLostNearbyNotificationUseCase.execute,
      ).not.toHaveBeenCalled();

      expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
    });

    it("ignores muted users", async () => {
      // Given
      vi.mocked(userRepository.findNotificationCandidates).mockResolvedValue([
        candidate({
          mutedUntil: new Date(Date.now() + 60_000),
        }),
      ]);

      // When
      await useCase.execute("report-1");

      // Then
      expect(
        createLostNearbyNotificationUseCase.execute,
      ).not.toHaveBeenCalled();

      expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
    });

    it("ignores users without location", async () => {
      // Given
      vi.mocked(userRepository.findNotificationCandidates).mockResolvedValue([
        candidate({
          lastKnownLatitude: null,
          lastKnownLongitude: null,
          lastKnownLocationAt: null,
        }),
      ]);

      // When
      await useCase.execute("report-1");

      // Then
      expect(
        createLostNearbyNotificationUseCase.execute,
      ).not.toHaveBeenCalled();

      expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
    });

    it("ignores users outside the configured radius", async () => {
      // Given
      vi.mocked(userRepository.findNotificationCandidates).mockResolvedValue([
        candidate({
          lastKnownLatitude: -33,
          lastKnownLongitude: -57,
          notificationRadius: 1,
        }),
      ]);

      // When
      await useCase.execute("report-1");

      // Then
      expect(
        createLostNearbyNotificationUseCase.execute,
      ).not.toHaveBeenCalled();

      expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe("notify subscribers", () => {
    it("returns when the report detail does not exist", async () => {
      // Given
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(
        lostReport() as never,
      );

      vi.mocked(userRepository.findNotificationCandidates).mockResolvedValue([
        candidate(),
      ]);

      vi.mocked(reportRepository.findDetailByPublicId).mockResolvedValue(null);

      // When
      await useCase.execute("report-1");

      // Then
      expect(
        createLostNearbyNotificationUseCase.execute,
      ).not.toHaveBeenCalled();

      expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
    });

    it("continues when one subscriber no longer exists", async () => {
      // Given
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(
        lostReport() as never,
      );

      vi.mocked(reportRepository.findDetailByPublicId).mockResolvedValue(
        reportDetail() as never,
      );

      vi.mocked(userRepository.findNotificationCandidates).mockResolvedValue([
        candidate(),
      ]);

      vi.mocked(userRepository.findByPublicId).mockResolvedValue(null);

      // When
      await useCase.execute("report-1");

      // Then
      expect(
        createLostNearbyNotificationUseCase.execute,
      ).not.toHaveBeenCalled();

      expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
    });

    it("creates the notification and sends the push", async () => {
      // Given
      vi.mocked(reportRepository.findByPublicId).mockResolvedValue(
        lostReport() as never,
      );

      vi.mocked(reportRepository.findDetailByPublicId).mockResolvedValue(
        reportDetail({
          pet: {
            name: "Firulais",
            images: [
              {
                photoUrl: "dog.jpg",
              },
            ],
          },
        }) as never,
      );

      vi.mocked(userRepository.findNotificationCandidates).mockResolvedValue([
        candidate(),
      ]);

      vi.mocked(userRepository.findByPublicId).mockResolvedValue({
        internalId: 10,
        id: "user-1",
      } as never);

      // When
      await useCase.execute("report-1");

      // Then
      expect(
        createLostNearbyNotificationUseCase.execute,
      ).toHaveBeenCalledOnce();

      expect(sendPushToUserUseCase.execute).toHaveBeenCalledOnce();
    });
  });
});
