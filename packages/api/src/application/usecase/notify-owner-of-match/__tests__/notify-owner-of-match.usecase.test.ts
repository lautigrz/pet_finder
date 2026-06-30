import { beforeEach, describe, expect, it, vi } from "vitest";
import { MatchNotification } from "@pet-alert/shared";
import { NotifyOwnerOfMatchUseCase } from "../notify-owner-of-match.usecase";
import { SendPushToUserUseCase } from "../../send-push-to-user/send-push-to-user.usecase";
import { SendPushToUserInput } from "../../send-push-to-user/send-push-to-user.input";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEmailService } from "@domain/services/IEmailService";
import { User } from "@domain/entities/User";

describe("NotifyOwnerOfMatchUseCase", () => {
  let sendPushToUser: { execute: ReturnType<typeof vi.fn> };
  let userRepository: { findByPublicId: ReturnType<typeof vi.fn> };
  let emailService: { sendMatchAlert: ReturnType<typeof vi.fn> };
  let useCase: NotifyOwnerOfMatchUseCase;

  beforeEach(() => {
    sendPushToUser = { execute: vi.fn() };
    userRepository = { findByPublicId: vi.fn().mockResolvedValue({ email: "owner@example.com" } as User) };
    emailService = { sendMatchAlert: vi.fn() };
    useCase = new NotifyOwnerOfMatchUseCase(
      sendPushToUser as unknown as SendPushToUserUseCase,
      userRepository as unknown as IUserRepository,
      emailService as unknown as IEmailService,
    );
  });

  const notification: MatchNotification = {
    ownerPublicId: "owner-1",
    rol: "dueno",
    lostReportPublicId: "lost-1",
    lostPetName: "Pupo",
    lostPetImage: null,
    matchPublicId: "match-1",
    matchedReportPublicId: "sighting-1",
    matchedImage: null,
    score: 0.8,
    createdAt: "2026-06-20T00:00:00.000Z",
  };

  it("sends a push to the owner with the match details", async () => {
    await useCase.execute(notification);

    expect(sendPushToUser.execute).toHaveBeenCalledTimes(1);
    const input = sendPushToUser.execute.mock.calls[0]![0] as SendPushToUserInput;
    expect(input.userPublicId).toBe("owner-1");
    expect(input.notification.body).toContain("80%");
    expect(input.notification.body).toContain("Pupo");
    expect(input.notification.data).toEqual({ reportId: "lost-1" });
  });

  it("uses a fallback name when the lost pet has no name", async () => {
    await useCase.execute({ ...notification, lostPetName: null });

    const input = sendPushToUser.execute.mock.calls[0]![0] as SendPushToUserInput;
    expect(input.notification.body).toContain("tu mascota");
  });

  it("emails the owner with the match score and pet name", async () => {
    await useCase.execute(notification);

    expect(emailService.sendMatchAlert).toHaveBeenCalledTimes(1);
    expect(emailService.sendMatchAlert).toHaveBeenCalledWith("owner@example.com", "Pupo", 80, "lost-1");
  });

  it("emails the fallback name when the lost pet has no name", async () => {
    await useCase.execute({ ...notification, lostPetName: null });

    expect(emailService.sendMatchAlert).toHaveBeenCalledWith("owner@example.com", "tu mascota", 80, "lost-1");
  });

  it("skips the email but still pushes when the owner is not found", async () => {
    userRepository.findByPublicId.mockResolvedValue(null);

    await useCase.execute(notification);

    expect(sendPushToUser.execute).toHaveBeenCalledTimes(1);
    expect(emailService.sendMatchAlert).not.toHaveBeenCalled();
  });
});
