import { beforeEach, describe, expect, it, vi } from "vitest";
import { SendPushToUserUseCase } from "../send-push-to-user.usecase";
import { SendPushToUserInput } from "../send-push-to-user.input";
import type { IDeviceTokenRepository } from "../../../../domain/repositories/IDeviceTokenRepository";
import type { IPushSender } from "../../../../domain/services/IPushSender";

describe("SendPushToUserUseCase", () => {
  let deviceTokenRepository: IDeviceTokenRepository;
  let pushSender: IPushSender;
  let useCase: SendPushToUserUseCase;

  beforeEach(() => {
    deviceTokenRepository = {
      registerForUser: vi.fn(),
      removeForUser: vi.fn(),
      findTokensByUser: vi.fn(),
    };
    pushSender = { send: vi.fn() };
    useCase = new SendPushToUserUseCase(deviceTokenRepository, pushSender);
  });

  const notification = { title: "PetFinder", body: "Coincidencia cerca tuyo" };

  it("sends the notification to every token of the user", async () => {
    // Given un usuario con dos dispositivos registrados
    vi.mocked(deviceTokenRepository.findTokensByUser).mockResolvedValue(["token-a", "token-b"]);

    // When mando el push al usuario
    await useCase.execute(new SendPushToUserInput("facundo-public-id", notification));

    // Then se busca por publicId y se envía a todos los tokens
    expect(deviceTokenRepository.findTokensByUser).toHaveBeenCalledWith("facundo-public-id");
    expect(pushSender.send).toHaveBeenCalledWith(["token-a", "token-b"], notification);
  });

  it("does not send when the user has no tokens", async () => {
    // Given un usuario sin dispositivos
    vi.mocked(deviceTokenRepository.findTokensByUser).mockResolvedValue([]);

    // When intento mandar el push
    await useCase.execute(new SendPushToUserInput("facundo-public-id", notification));

    // Then no se llama al sender (no hay a quién mandar)
    expect(pushSender.send).not.toHaveBeenCalled();
  });
});
