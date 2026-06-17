import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IEmailVerificationTokenRepository } from "../../../domain/repositories/IEmailVerificationTokenRepository";
import { InvalidVerificationTokenError } from "../../../domain/errors/InvalidVerificationTokenError";
import { EmailVerificationToken } from "../../../domain/entities/EmailVerificationToken";
import { VerifyEmailInput } from "./verify-email.input";

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenRepository: IEmailVerificationTokenRepository,
  ) {}

  async execute(input: VerifyEmailInput): Promise<void> {
    const token = await this.findUsableToken(input.token);
    await this.userRepository.markVerified(token.userId);
    await this.tokenRepository.markAsUsed(token.requireId(), new Date());
  }

  private async findUsableToken(value: string): Promise<EmailVerificationToken> {
    const token = await this.tokenRepository.findByValue(value);
    if (!token) throw new InvalidVerificationTokenError("not_found");
    token.ensureUsable();
    return token;
  }
}
