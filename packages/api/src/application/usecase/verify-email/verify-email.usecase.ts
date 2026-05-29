import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IEmailVerificationTokenRepository } from "../../../domain/repositories/IEmailVerificationTokenRepository";
import { InvalidVerificationTokenError } from "../../../domain/errors/InvalidVerificationTokenError";
import { VerifyEmailInput } from "./verify-email.input";

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenRepository: IEmailVerificationTokenRepository,
  ) {}

  async execute(input: VerifyEmailInput): Promise<void> {
    const token = await this.tokenRepository.findByValue(input.token);
    if (!token) throw new InvalidVerificationTokenError("not_found");
    if (token.isUsed()) throw new InvalidVerificationTokenError("already_used");
    if (token.isExpired()) throw new InvalidVerificationTokenError("expired");
    await this.userRepository.markVerified(token.userId);
    await this.tokenRepository.markAsUsed(token.id!, new Date());
  }
}
