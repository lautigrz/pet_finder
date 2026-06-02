import { IPasswordResetTokenRepository } from "../../../domain/repositories/IPasswordResetTokenRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { IPasswordHasher } from "../../../domain/services/IPasswordHasher";
import { InvalidPasswordResetTokenError } from "../../../domain/errors/InvalidPasswordResetTokenError";
import { ResetPasswordInput } from "./reset-password.input";

export class ResetPasswordUseCase {
  constructor(
    private readonly tokenRepository: IPasswordResetTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const token = await this.tokenRepository.findByValue(input.token);
    if (!token) throw new InvalidPasswordResetTokenError("not_found");
    if (token.isUsed()) throw new InvalidPasswordResetTokenError("already_used");
    if (token.isExpired()) throw new InvalidPasswordResetTokenError("expired");
    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.userRepository.updatePassword(token.userId, passwordHash);
    await this.tokenRepository.markAsUsed(token.id!, new Date());
    await this.refreshTokenRepository.revokeAllByUser(token.userId, new Date());
  }
}
