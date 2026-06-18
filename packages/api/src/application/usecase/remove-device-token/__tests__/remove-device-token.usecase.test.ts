import { beforeEach, describe, expect, it, vi } from "vitest";
import { RemoveDeviceTokenUseCase } from "../remove-device-token.usecase";
import { RemoveDeviceTokenInput } from "../remove-device-token.input";
import type { IDeviceTokenRepository } from "../../../../domain/repositories/IDeviceTokenRepository";

describe("RemoveDeviceTokenUseCase", () => {
  let deviceTokenRepository: IDeviceTokenRepository;
  let useCase: RemoveDeviceTokenUseCase;

  beforeEach(() => {
    deviceTokenRepository = {
      registerForUser: vi.fn(),
      removeForUser: vi.fn(),
      findTokensByUser: vi.fn(),
    };

    useCase = new RemoveDeviceTokenUseCase(deviceTokenRepository);
  });

  it("removes the token of the authenticated user", async () => {
    // Given un usuario logueado y el token a desvincular
    const input = new RemoveDeviceTokenInput("facundo-public-id", "fcm-token-123");

    // When borro el token
    await useCase.execute(input);

    // Then el repositorio lo borra para ese usuario
    expect(deviceTokenRepository.removeForUser).toHaveBeenCalledWith(
      "facundo-public-id",
      "fcm-token-123",
    );
  });

  describe("when the repository fails", () => {
    it("propagates the repository error", async () => {
      // Given un repositorio que falla
      vi.mocked(deviceTokenRepository.removeForUser).mockRejectedValue(
        new Error("database unavailable"),
      );

      // When intento borrar el token
      const action = () =>
        useCase.execute(new RemoveDeviceTokenInput("facundo-public-id", "fcm-token-123"));

      // Then el error se propaga
      await expect(action).rejects.toThrow("database unavailable");
    });
  });
});
