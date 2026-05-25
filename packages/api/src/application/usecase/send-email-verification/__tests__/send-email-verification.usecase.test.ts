import { describe, it, expect, vi, beforeEach } from "vitest";
import { SendEmailVerificationUseCase } from "../send-email-verification.usecase";
import { SendEmailVerificationInput } from "../send-email-verification.input";
import type { IEmailVerificationTokenRepository } from "../../../../domain/repositories/IEmailVerificationTokenRepository";
import type { ITokenGenerator } from "../../../../domain/services/ITokenGenerator";
import type { IEmailService } from "../../../../domain/services/IEmailService";

const VALID_TOKEN = "a".repeat(64);

describe("SendEmailVerificationUseCase", () => {
  let tokenRepository: IEmailVerificationTokenRepository;
  let tokenGenerator: ITokenGenerator;
  let emailService: IEmailService;
  let useCase: SendEmailVerificationUseCase;

  beforeEach(() => {
    tokenRepository = { save: vi.fn(), findByValue: vi.fn(), markAsUsed: vi.fn() };
    tokenGenerator = { generate: vi.fn() };
    emailService = { sendVerificationLink: vi.fn() };
    useCase = new SendEmailVerificationUseCase(tokenRepository, tokenGenerator, emailService);
  });

  it("generates a token, persists it and sends the verification link", async () => {
    // Given un generator que devuelve un token valido
    vi.mocked(tokenGenerator.generate).mockReturnValue(VALID_TOKEN);

    // When ejecuto el caso de uso
    await useCase.execute(new SendEmailVerificationInput(42, "juan@example.com"));

    // Then se persiste el token con expiracion futura y se envia el email
    expect(tokenRepository.save).toHaveBeenCalledOnce();
    const savedToken = vi.mocked(tokenRepository.save).mock.calls[0][0];
    expect(savedToken.userId).toBe(42);
    expect(savedToken.value).toBe(VALID_TOKEN);
    expect(savedToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(emailService.sendVerificationLink).toHaveBeenCalledWith("juan@example.com", VALID_TOKEN);
  });
});
