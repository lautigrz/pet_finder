import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotifyAppealResultUseCase } from "../notify-appeal-result.usecase";
import { NotifyAppealResultInput } from "../notify-appeal-result.input";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEmailService } from "@domain/services/IEmailService";
import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";
import { User } from "@domain/entities/User";

describe("NotifyAppealResultUseCase", () => {
  let userRepository: { findById: ReturnType<typeof vi.fn> };
  let emailService: { sendAppealAcceptedNotice: ReturnType<typeof vi.fn>; sendAppealRejectedNotice: ReturnType<typeof vi.fn> };
  let useCase: NotifyAppealResultUseCase;

  beforeEach(() => {
    const appellant = User.reconstruct(9, "u", "owner@test.com", "owner", "x".repeat(60), true, new Date("2026-06-20"), null, null, null);
    userRepository = { findById: vi.fn().mockResolvedValue(appellant) };
    emailService = { sendAppealAcceptedNotice: vi.fn(), sendAppealRejectedNotice: vi.fn() };
    useCase = new NotifyAppealResultUseCase(
      userRepository as unknown as IUserRepository,
      emailService as unknown as IEmailService,
    );
  });

  it("apelación aceptada manda el mail de aceptada con el tipo", async () => {
    await useCase.execute(new NotifyAppealResultInput(9, true, AppealTargetType.POST));

    expect(emailService.sendAppealAcceptedNotice).toHaveBeenCalledWith("owner@test.com", AppealTargetType.POST);
    expect(emailService.sendAppealRejectedNotice).not.toHaveBeenCalled();
  });

  it("apelación rechazada manda el mail de rechazada con el tipo", async () => {
    await useCase.execute(new NotifyAppealResultInput(9, false, AppealTargetType.ACCOUNT));

    expect(emailService.sendAppealRejectedNotice).toHaveBeenCalledWith("owner@test.com", AppealTargetType.ACCOUNT);
  });

  it("no manda nada si el apelante no existe", async () => {
    userRepository.findById.mockResolvedValue(null);

    await useCase.execute(new NotifyAppealResultInput(9, true, AppealTargetType.POST));

    expect(emailService.sendAppealAcceptedNotice).not.toHaveBeenCalled();
  });
});
