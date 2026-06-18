import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterDeviceTokenUseCase } from "../register-device-token.usecase";
import { RegisterDeviceTokenInput } from "../register-device-token.input";
import type { IDeviceTokenRepository } from "../../../../domain/repositories/IDeviceTokenRepository";

describe("RegisterDeviceTokenUseCase", () => {
  let deviceTokenRepository: IDeviceTokenRepository;
  let useCase: RegisterDeviceTokenUseCase;

  beforeEach(() => {
    deviceTokenRepository = {
      registerForUser: vi.fn(),
      removeForUser: vi.fn(),
      findTokensByUser: vi.fn(),
    };

    useCase = new RegisterDeviceTokenUseCase(deviceTokenRepository);
  });

  it("registers the token for the authenticated user", async () => {
    // Given un usuario logueado y el token de su dispositivo
    const input = new RegisterDeviceTokenInput("facundo-public-id", "fcm-token-123");

    // When registro el token
    await useCase.execute(input);

    // Then el repositorio lo guarda asociado a ese usuario
    expect(deviceTokenRepository.registerForUser).toHaveBeenCalledWith(
      "facundo-public-id",
      "fcm-token-123",
    );
  });

  describe("when the repository fails", () => {
    it("propagates the repository error", async () => {
      // Given un repositorio que falla
      vi.mocked(deviceTokenRepository.registerForUser).mockRejectedValue(
        new Error("database unavailable"),
      );

      // When intento registrar el token
      const action = () =>
        useCase.execute(new RegisterDeviceTokenInput("facundo-public-id", "fcm-token-123"));

      // Then el error se propaga
      await expect(action).rejects.toThrow("database unavailable");
    });
  });
});
