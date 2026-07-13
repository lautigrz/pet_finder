import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/websocket/socket", () => ({
  emitToUser: vi.fn(),
}));

import { emitToUser } from "@infrastructure/websocket/socket";

import { CreateLostNearbyNotificationUseCase } from "../create-lost-nearby-notification.usecase";
import { CreateLostNearbyNotificationInput } from "../create-lost-nearby-notification.input";

import { LostNearbyNotification } from "@domain/entities/LostNearbyNotification";
import type { ILostNearbyNotificationRepository } from "@domain/repositories/ILostNearbyNotificationRepository";

import { LOST_NEARBY_EVENT } from "@pet-alert/shared";

function input(
  overrides: Partial<CreateLostNearbyNotificationInput> = {},
): CreateLostNearbyNotificationInput {
  return Object.assign(
    new CreateLostNearbyNotificationInput(
      10,
      "user-public-id",
      "report-public-id",
      "Firulais",
      "dog.jpg",
      "Av. Corrientes 1234",
      "Mascota perdida",
      "Se perdió cerca tuyo",
    ),
    overrides,
  );
}

function notification(
  overrides: Partial<{
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

describe("CreateLostNearbyNotificationUseCase", () => {
  let repository: ILostNearbyNotificationRepository;

  let useCase: CreateLostNearbyNotificationUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    repository = {
      save: vi.fn(),
    } as unknown as ILostNearbyNotificationRepository;

    useCase = new CreateLostNearbyNotificationUseCase(repository);
  });

  describe("execute", () => {
    it("saves the notification", async () => {
      // Given
      const saved = notification();

      vi.mocked(repository.save).mockResolvedValue(saved);

      // When
      await useCase.execute(input());

      // Then
      expect(repository.save).toHaveBeenCalledOnce();

      expect(repository.save).toHaveBeenCalledWith(
        expect.any(LostNearbyNotification),
      );
    });

    it("returns the saved notification", async () => {
      // Given
      const saved = notification();

      vi.mocked(repository.save).mockResolvedValue(saved);

      // When
      const result = await useCase.execute(input());

      // Then
      expect(result).toBe(saved);
    });

    it("emits the websocket notification", async () => {
      // Given
      const saved = notification();

      vi.mocked(repository.save).mockResolvedValue(saved);

      // When
      await useCase.execute(input());

      // Then
      expect(emitToUser).toHaveBeenCalledOnce();

      expect(emitToUser).toHaveBeenCalledWith(
        "user-public-id",
        LOST_NEARBY_EVENT,
        {
          userPublicId: "user-public-id",
          notificationPublicId: "notification-public-id",
          reportPublicId: "report-public-id",
          petName: "Firulais",
          reportImage: "dog.jpg",
          reportAddress: "Av. Corrientes 1234",
          title: "Mascota perdida",
          body: "Se perdió cerca tuyo",
          seen: false,
          createdAt: "2026-07-12T10:00:00.000Z",
        },
      );
    });

    it("propagates repository errors without emitting the websocket event", async () => {
      // Given
      vi.mocked(repository.save).mockRejectedValue(new Error("Database error"));

      // When / Then
      await expect(useCase.execute(input())).rejects.toThrow("Database error");

      expect(emitToUser).not.toHaveBeenCalled();
    });
  });
});
