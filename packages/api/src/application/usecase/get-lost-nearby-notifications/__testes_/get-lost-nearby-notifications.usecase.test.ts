import { beforeEach, describe, expect, it, vi } from "vitest";

import { GetLostNearbyNotificationsUseCase } from "../get-lost-nearby-notifications.usecase";
import { GetLostNearbyNotificationsOutput } from "../get-lost-nearby-notifications.output";

import { LostNearbyNotification } from "@domain/entities/LostNearbyNotification";
import type { ILostNearbyNotificationRepository } from "@domain/repositories/ILostNearbyNotificationRepository";

function notification(
  overrides: Partial<{
    notificationId: number;
    publicId: string;
    userId: number;
    reportPublicId: string;
    petName: string | null;
    reportImage: string | null;
    reportAddress: string | null;
    title: string;
    body: string;
    seen: boolean;
    createdAt: Date;
  }> = {},
): LostNearbyNotification {
  return LostNearbyNotification.restore({
    notificationId: 1,
    publicId: "notification-public-id",
    userId: 10,
    reportPublicId: "report-public-id",
    petName: "Firulais",
    reportImage: "dog.jpg",
    reportAddress: "Av. Corrientes 1234",
    title: "Mascota perdida",
    body: "Se perdió cerca tuyo",
    seen: false,
    createdAt: new Date("2026-07-12T10:00:00Z"),
    ...overrides,
  });
}

describe("GetLostNearbyNotificationsUseCase", () => {
  let repository: ILostNearbyNotificationRepository;

  let useCase: GetLostNearbyNotificationsUseCase;

  beforeEach(() => {
    repository = {
      findByUserPublicId: vi.fn(),
    } as unknown as ILostNearbyNotificationRepository;

    useCase = new GetLostNearbyNotificationsUseCase(repository);
  });

  describe("execute", () => {
    it("gets the notifications of the requested user", async () => {
      // Given
      vi.mocked(repository.findByUserPublicId).mockResolvedValue([
        notification(),
      ]);

      // When
      await useCase.execute("user-public-id");

      // Then
      expect(repository.findByUserPublicId).toHaveBeenCalledOnce();

      expect(repository.findByUserPublicId).toHaveBeenCalledWith(
        "user-public-id",
      );
    });

    it("maps domain notifications to output objects", async () => {
      // Given
      const domainNotification = notification();

      vi.mocked(repository.findByUserPublicId).mockResolvedValue([
        domainNotification,
      ]);

      // When
      const result = await useCase.execute("user-public-id");

      // Then
      expect(result).toEqual([
        GetLostNearbyNotificationsOutput.fromDomain(domainNotification),
      ]);
    });

    it("propagates repository errors", async () => {
      // Given
      vi.mocked(repository.findByUserPublicId).mockRejectedValue(
        new Error("Database error"),
      );

      // When / Then
      await expect(useCase.execute("user-public-id")).rejects.toThrow(
        "Database error",
      );
    });
  });
});
