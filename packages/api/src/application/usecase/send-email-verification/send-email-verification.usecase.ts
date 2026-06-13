import { EmailVerificationToken } from "../../../domain/entities/EmailVerificationToken";
import { IEmailVerificationTokenRepository } from "../../../domain/repositories/IEmailVerificationTokenRepository";
import { ITokenGenerator } from "../../../domain/services/ITokenGenerator";
import { IEmailService } from "../../../domain/services/IEmailService";
import { SendEmailVerificationInput } from "./send-email-verification.input";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export class SendEmailVerificationUseCase {
  constructor(
    private readonly tokenRepository: IEmailVerificationTokenRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly emailService: IEmailService,
  ) {}

  async execute(input: SendEmailVerificationInput): Promise<void> {
    const tokenValue = await this.issueVerificationToken(input.internalUserId);
    await this.emailService.sendVerificationLink(input.email, tokenValue);
  }

  private async issueVerificationToken(userId: number): Promise<string> {
    const tokenValue = this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await this.tokenRepository.save(EmailVerificationToken.create(userId, tokenValue, expiresAt));
    return tokenValue;
  }
}
