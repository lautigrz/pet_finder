import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

import { RegisterDeviceTokenController } from "../notification/register-device-token.controller";
import { RemoveDeviceTokenController } from "../notification/remove-device-token.controller";
import { GetLostNearbyNotificationsController } from "../notification/get-lost-nearby-notifications.controller";
import { MarkLostNearbyNotificationSeenController } from "../notification/mark-lost-nearby-notification-seen.controller";

import { RegisterDeviceTokenUseCase } from "@application/usecase/register-device-token/register-device-token.usecase";
import { RegisterDeviceTokenInput } from "@application/usecase/register-device-token/register-device-token.input";

import { RemoveDeviceTokenUseCase } from "@application/usecase/remove-device-token/remove-device-token.usecase";
import { RemoveDeviceTokenInput } from "@application/usecase/remove-device-token/remove-device-token.input";
import { GetLostNearbyNotificationsUseCase } from "@application/usecase/get-lost-nearby-notifications/get-lost-nearby-notifications.usecase";
import { MarkLostNearbyNotificationSeenUseCase } from "@application/usecase/mark-lost-nearby-notification-seen/mark-lost-nearby-notification-seen.usecase";
import { MarkLostNearbyNotificationSeenInput } from "@application/usecase/mark-lost-nearby-notification-seen/mark-lost-nearby-notification-seen.input";

function response(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    send: vi.fn(),
  } as unknown as Response;
}

function registerRequest(token = "device-token") {
  return {
    auth: {
      sub: "user-public-id",
    },
    validated: {
      body: {
        token,
      },
    },
    params: {},
  };
}

function removeRequest(token = "device-token") {
  return {
    auth: {
      sub: "user-public-id",
    },
    validated: {
      body: {
        token,
      },
    },
    params: {},
  };
}

function markAsSeenRequest(notificationPublicId = "notification-public-id") {
  return {
    auth: {
      sub: "user-public-id",
    },
    validated: {
      body: {},
    },
    params: {
      notificationPublicId,
    },
  };
}

describe("Notification controllers", () => {
  describe("RegisterDeviceTokenController", () => {
    let useCase: RegisterDeviceTokenUseCase;

    let controller: RegisterDeviceTokenController;

    beforeEach(() => {
      useCase = {
        execute: vi.fn().mockResolvedValue(undefined),
      } as unknown as RegisterDeviceTokenUseCase;

      controller = new RegisterDeviceTokenController(useCase);
    });

    it("registers the device token", async () => {
      // Given
      const req = registerRequest();

      const res = response();

      // When
      await controller.handle(req as Request, res, vi.fn());

      // Then
      expect(useCase.execute).toHaveBeenCalledOnce();

      const input: RegisterDeviceTokenInput = vi.mocked(useCase.execute).mock
        .calls[0]![0];

      expect(input.userPublicId).toBe("user-public-id");
      expect(input.token).toBe("device-token");

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        registered: true,
      });
    });

    it("passes use case errors to the next middleware", async () => {
      // Given
      const error = new Error("Database error");

      vi.mocked(useCase.execute).mockRejectedValue(error);

      const req = registerRequest();

      const res = response();

      const next = vi.fn();

      // When
      await controller.handle(req as Request, res, next);

      // Then
      expect(next).toHaveBeenCalledOnce();

      expect(next).toHaveBeenCalledWith(error);
    });
  });
  describe("RemoveDeviceTokenController", () => {
    let useCase: RemoveDeviceTokenUseCase;

    let controller: RemoveDeviceTokenController;

    beforeEach(() => {
      useCase = {
        execute: vi.fn().mockResolvedValue(undefined),
      } as unknown as RemoveDeviceTokenUseCase;

      controller = new RemoveDeviceTokenController(useCase);
    });

    it("removes the device token", async () => {
      // Given
      const req = removeRequest();

      const res = response();

      // When
      await controller.handle(req as Request, res, vi.fn());

      // Then
      expect(useCase.execute).toHaveBeenCalledOnce();

      const input: RemoveDeviceTokenInput = vi.mocked(useCase.execute).mock
        .calls[0]![0];

      expect(input.userPublicId).toBe("user-public-id");
      expect(input.token).toBe("device-token");

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledOnce();
    });

    it("passes use case errors to the next middleware", async () => {
      // Given
      const error = new Error("Database error");

      vi.mocked(useCase.execute).mockRejectedValue(error);

      const req = removeRequest();

      const res = response();

      const next = vi.fn();

      // When
      await controller.handle(req as Request, res, next);

      // Then
      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("GetLostNearbyNotificationsController", () => {
    let useCase: GetLostNearbyNotificationsUseCase;

    let controller: GetLostNearbyNotificationsController;

    beforeEach(() => {
      useCase = {
        execute: vi.fn(),
      } as unknown as GetLostNearbyNotificationsUseCase;

      controller = new GetLostNearbyNotificationsController(useCase);
    });

    it("returns the notifications of the authenticated user", async () => {
      // Given
      const notifications = [
        {
          notificationPublicId: "notification-1",
          title: "Nueva mascota perdida",
        },
      ];

      vi.mocked(useCase.execute).mockResolvedValue(notifications as never);

      const req = registerRequest();

      const res = response();

      // When
      await controller.handle(req as Request, res, vi.fn());

      // Then
      expect(useCase.execute).toHaveBeenCalledOnce();

      expect(useCase.execute).toHaveBeenCalledWith("user-public-id");

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith(notifications);
    });

    it("passes use case errors to the next middleware", async () => {
      // Given
      const error = new Error("Database error");

      vi.mocked(useCase.execute).mockRejectedValue(error);

      const req = registerRequest();

      const res = response();

      const next = vi.fn();

      // When
      await controller.handle(req as Request, res, next);

      // Then
      expect(next).toHaveBeenCalledOnce();

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("MarkLostNearbyNotificationSeenController", () => {
    let useCase: MarkLostNearbyNotificationSeenUseCase;

    let controller: MarkLostNearbyNotificationSeenController;

    beforeEach(() => {
      useCase = {
        execute: vi.fn().mockResolvedValue(undefined),
      } as unknown as MarkLostNearbyNotificationSeenUseCase;

      controller = new MarkLostNearbyNotificationSeenController(useCase);
    });

    it("marks the notification as seen", async () => {
      // Given
      const req = markAsSeenRequest();

      const res = response();

      // When
      await controller.handle(req as unknown as Request, res, vi.fn());

      // Then
      expect(useCase.execute).toHaveBeenCalledOnce();

      const input: MarkLostNearbyNotificationSeenInput = vi.mocked(
        useCase.execute,
      ).mock.calls[0]![0];

      expect(input.notificationPublicId).toBe("notification-public-id");

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalledOnce();
    });

    it("passes use case errors to the next middleware", async () => {
      // Given
      const error = new Error("Database error");

      vi.mocked(useCase.execute).mockRejectedValue(error);

      const req = markAsSeenRequest();

      const res = response();

      const next = vi.fn();

      // When
      await controller.handle(req as unknown as Request, res, next);

      // Then
      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
