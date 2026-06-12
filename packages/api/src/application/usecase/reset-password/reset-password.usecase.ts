import { IPasswordResetTokenRepository } from "../../../domain/repositories/IPasswordResetTokenRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { IPasswordHasher } from "../../../domain/services/IPasswordHasher";
import { InvalidPasswordResetTokenError } from "../../../domain/errors/InvalidPasswordResetTokenError";
import { PasswordResetToken } from "../../../domain/entities/PasswordResetToken";
import { ResetPasswordInput } from "./reset-password.input";

export class ResetPasswordUseCase {
  constructor(
    private readonly tokenRepository: IPasswordResetTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const token = await this.findUsableToken(input.token);
    await this.updatePassword(token.userId, input.newPassword);
    await this.consumeToken(token);
  }

  private async findUsableToken(value: string): Promise<PasswordResetToken> {
    const token = await this.tokenRepository.findByValue(value);
    if (!token) throw new InvalidPasswordResetTokenError("not_found");
    token.ensureUsable();
    return token;
  }

  private async updatePassword(userId: number, newPassword: string): Promise<void> {
    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.userRepository.updatePassword(userId, passwordHash);
  }

  private async consumeToken(token: PasswordResetToken): Promise<void> {
    await this.tokenRepository.markAsUsed(token.requireId(), new Date());
    await this.refreshTokenRepository.revokeAllByUser(token.userId, new Date());
  }
}
