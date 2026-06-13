import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IPasswordResetTokenRepository } from "../../../domain/repositories/IPasswordResetTokenRepository";
import { ITokenGenerator } from "../../../domain/services/ITokenGenerator";
import { IEmailService } from "../../../domain/services/IEmailService";
import { PasswordResetToken } from "../../../domain/entities/PasswordResetToken";
import { User } from "../../../domain/entities/User";
import { EmailAddress } from "../../../domain/shared/email/email-address.vo";
import { RequestPasswordResetInput } from "./request-password-reset.input";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenRepository: IPasswordResetTokenRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly emailService: IEmailService,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const user = await this.userRepository.findByEmail(EmailAddress.create(input.email).value);
    if (!user) return;
    await this.sendResetLink(user);
  }

  private async sendResetLink(user: User): Promise<void> {
    const tokenValue = await this.issueResetToken(user.requireInternalId());
    await this.emailService.sendPasswordResetLink(user.email, tokenValue);
  }

  private async issueResetToken(userId: number): Promise<string> {
    const tokenValue = this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.tokenRepository.save(PasswordResetToken.create(userId, tokenValue, expiresAt));
    return tokenValue;
  }
}
