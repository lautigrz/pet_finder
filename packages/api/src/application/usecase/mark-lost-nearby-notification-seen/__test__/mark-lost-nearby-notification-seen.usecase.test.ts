import { beforeEach, describe, expect, it, vi } from "vitest";

import { MarkLostNearbyNotificationSeenUseCase } from "../mark-lost-nearby-notification-seen.usecase";
import { MarkLostNearbyNotificationSeenInput } from "../mark-lost-nearby-notification-seen.input";

import type { ILostNearbyNotificationRepository } from "@domain/repositories/ILostNearbyNotificationRepository";

describe("MarkLostNearbyNotificationSeenUseCase", () => {
  let repository: ILostNearbyNotificationRepository;

  let useCase: MarkLostNearbyNotificationSeenUseCase;

  beforeEach(() => {
    repository = {
      markAsSeen: vi.fn().mockResolvedValue(undefined),
    } as unknown as ILostNearbyNotificationRepository;

    useCase = new MarkLostNearbyNotificationSeenUseCase(repository);
  });

  describe("execute", () => {
    it("marks the notification as seen", async () => {
      // Given
      const input = new MarkLostNearbyNotificationSeenInput(
        "notification-public-id",
      );

      // When
      await useCase.execute(input);

      // Then
      expect(repository.markAsSeen).toHaveBeenCalledOnce();

      expect(repository.markAsSeen).toHaveBeenCalledWith(
        "notification-public-id",
      );
    });

    it("propagates repository errors", async () => {
      // Given
      vi.mocked(repository.markAsSeen).mockRejectedValue(
        new Error("Database error"),
      );

      const input = new MarkLostNearbyNotificationSeenInput(
        "notification-public-id",
      );

      // When / Then
      await expect(useCase.execute(input)).rejects.toThrow("Database error");
    });
  });
});
