import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotifyOwnerOfContentSentenceUseCase } from "../notify-owner-of-content-sentence.usecase";
import { NotifyOwnerOfContentSentenceInput } from "../notify-owner-of-content-sentence.input";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEmailService } from "@domain/services/IEmailService";
import type { IAppealTokenSigner } from "@domain/services/IAppealTokenSigner";
import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";
import { User } from "@domain/entities/User";

describe("NotifyOwnerOfContentSentenceUseCase", () => {
  let userRepository: { findByPublicId: ReturnType<typeof vi.fn> };
  let emailService: {
    sendPublicationRemovedNotice: ReturnType<typeof vi.fn>;
    sendAccountSuspendedNotice: ReturnType<typeof vi.fn>;
  };
  let appealTokenSigner: { sign: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> };
  let useCase: NotifyOwnerOfContentSentenceUseCase;

  beforeEach(() => {
    userRepository = { findByPublicId: vi.fn().mockResolvedValue({ email: "owner@example.com" } as User) };
    emailService = { sendPublicationRemovedNotice: vi.fn(), sendAccountSuspendedNotice: vi.fn() };
    appealTokenSigner = { sign: vi.fn().mockReturnValue("appeal-token"), verify: vi.fn() };
    useCase = new NotifyOwnerOfContentSentenceUseCase(
      userRepository as unknown as IUserRepository,
      emailService as unknown as IEmailService,
      appealTokenSigner as unknown as IAppealTokenSigner,
    );
  });

  it("manda el mail de publicación dada de baja con el token de apelación del post", async () => {
    await useCase.execute(new NotifyOwnerOfContentSentenceInput("owner-1", "PUBLICATION_REMOVED", "post-1"));

    expect(appealTokenSigner.sign).toHaveBeenCalledWith({ targetType: AppealTargetType.POST, targetPublicId: "post-1", appellantPublicId: "owner-1" });
    expect(emailService.sendPublicationRemovedNotice).toHaveBeenCalledWith("owner@example.com", "appeal-token");
    expect(emailService.sendAccountSuspendedNotice).not.toHaveBeenCalled();
  });

  it("manda el mail de cuenta suspendida con el motivo, el token y el target de cuenta", async () => {
    await useCase.execute(new NotifyOwnerOfContentSentenceInput("owner-1", "ACCOUNT_SUSPENDED", "owner-1", "Contenido fraudulento"));

    expect(appealTokenSigner.sign).toHaveBeenCalledWith({ targetType: AppealTargetType.ACCOUNT, targetPublicId: "owner-1", appellantPublicId: "owner-1" });
    expect(emailService.sendAccountSuspendedNotice).toHaveBeenCalledWith("owner@example.com", "Contenido fraudulento", "appeal-token");
    expect(emailService.sendPublicationRemovedNotice).not.toHaveBeenCalled();
  });

  it("manda el mail de cuenta suspendida sin motivo cuando no hay", async () => {
    await useCase.execute(new NotifyOwnerOfContentSentenceInput("owner-1", "ACCOUNT_SUSPENDED", "owner-1"));

    expect(emailService.sendAccountSuspendedNotice).toHaveBeenCalledWith("owner@example.com", null, "appeal-token");
  });

  it("no manda nada si el dueño no existe", async () => {
    userRepository.findByPublicId.mockResolvedValue(null);

    await useCase.execute(new NotifyOwnerOfContentSentenceInput("owner-1", "PUBLICATION_REMOVED", "post-1"));

    expect(emailService.sendPublicationRemovedNotice).not.toHaveBeenCalled();
    expect(emailService.sendAccountSuspendedNotice).not.toHaveBeenCalled();
  });
});
