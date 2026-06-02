import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IPasswordResetTokenRepository } from "../../../domain/repositories/IPasswordResetTokenRepository";
import { ITokenGenerator } from "../../../domain/services/ITokenGenerator";
import { IEmailService } from "../../../domain/services/IEmailService";
import { PasswordResetToken } from "../../../domain/entities/PasswordResetToken";
import { RequestPasswordResetInput } from "./request-password-reset.input";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenRepository: IPasswordResetTokenRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly emailService: IEmailService,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email.trim().toLowerCase());
    if (!user) return;
    const tokenValue = this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.tokenRepository.save(
      PasswordResetToken.create(user.internalId!, tokenValue, expiresAt),
    );
    await this.emailService.sendPasswordResetLink(user.email, tokenValue);
  }
}
