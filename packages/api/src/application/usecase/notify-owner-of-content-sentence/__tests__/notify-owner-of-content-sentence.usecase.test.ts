import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotifyOwnerOfContentSentenceUseCase } from "../notify-owner-of-content-sentence.usecase";
import { NotifyOwnerOfContentSentenceInput } from "../notify-owner-of-content-sentence.input";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IEmailService } from "@domain/services/IEmailService";
import { User } from "@domain/entities/User";

describe("NotifyOwnerOfContentSentenceUseCase", () => {
  let userRepository: { findByPublicId: ReturnType<typeof vi.fn> };
  let emailService: {
    sendPublicationRemovedNotice: ReturnType<typeof vi.fn>;
    sendAccountSuspendedNotice: ReturnType<typeof vi.fn>;
  };
  let useCase: NotifyOwnerOfContentSentenceUseCase;

  beforeEach(() => {
    userRepository = { findByPublicId: vi.fn().mockResolvedValue({ email: "owner@example.com" } as User) };
    emailService = { sendPublicationRemovedNotice: vi.fn(), sendAccountSuspendedNotice: vi.fn() };
    useCase = new NotifyOwnerOfContentSentenceUseCase(
      userRepository as unknown as IUserRepository,
      emailService as unknown as IEmailService,
    );
  });

  it("le manda al dueño el mail de publicación dada de baja", async () => {
    await useCase.execute(new NotifyOwnerOfContentSentenceInput("owner-1", "PUBLICATION_REMOVED"));

    expect(emailService.sendPublicationRemovedNotice).toHaveBeenCalledWith("owner@example.com");
    expect(emailService.sendAccountSuspendedNotice).not.toHaveBeenCalled();
  });

  it("le manda al dueño el mail de cuenta suspendida con el motivo", async () => {
    await useCase.execute(new NotifyOwnerOfContentSentenceInput("owner-1", "ACCOUNT_SUSPENDED", "Contenido fraudulento"));

    expect(emailService.sendAccountSuspendedNotice).toHaveBeenCalledWith("owner@example.com", "Contenido fraudulento");
    expect(emailService.sendPublicationRemovedNotice).not.toHaveBeenCalled();
  });

  it("manda el mail de cuenta suspendida sin motivo cuando no hay", async () => {
    await useCase.execute(new NotifyOwnerOfContentSentenceInput("owner-1", "ACCOUNT_SUSPENDED"));

    expect(emailService.sendAccountSuspendedNotice).toHaveBeenCalledWith("owner@example.com", null);
  });

  it("no manda nada si el dueño no existe", async () => {
    userRepository.findByPublicId.mockResolvedValue(null);

    await useCase.execute(new NotifyOwnerOfContentSentenceInput("owner-1", "PUBLICATION_REMOVED"));

    expect(emailService.sendPublicationRemovedNotice).not.toHaveBeenCalled();
    expect(emailService.sendAccountSuspendedNotice).not.toHaveBeenCalled();
  });
});
