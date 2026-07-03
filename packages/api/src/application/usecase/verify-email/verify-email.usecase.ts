import type { IUserRepository } from "../../../domain/repositories/IUserRepository";
import type { IEmailVerificationTokenRepository } from "../../../domain/repositories/IEmailVerificationTokenRepository";
import { InvalidVerificationTokenError } from "../../../domain/errors/InvalidVerificationTokenError";
import { EmailVerificationToken } from "../../../domain/entities/EmailVerificationToken";
import { UserExpAction } from "../../../domain/entities/UserExpAction";
import { VerifyEmailInput } from "./verify-email.input";
import { AwardUserExpInput } from "../award-user-exp/award-user-exp.input";
import type { AwardUserExpUseCase } from "../award-user-exp/award-user-exp.usecase";
import { inject, injectable } from "tsyringe";

@injectable()
export class VerifyEmailUseCase {
  constructor(
    @inject("UserRepository")
    private readonly userRepository: IUserRepository,
    @inject("EmailVerificationTokenRepository")
    private readonly tokenRepository: IEmailVerificationTokenRepository,
    @inject("AwardUserExpUseCase")
    private readonly awardUserExpUseCase?: AwardUserExpUseCase,
  ) {}

  async execute(input: VerifyEmailInput): Promise<void> {
    const token = await this.findUsableToken(input.token);
    await this.userRepository.markVerified(token.userId);
    await this.tokenRepository.markAsUsed(token.requireId(), new Date());
    await this.awardUserExpForVerifiedEmail(token.userId);
  }

  private async awardUserExpForVerifiedEmail(internalUserId: number): Promise<void> {
    if (!this.awardUserExpUseCase) return;

    const user = await this.userRepository.findById(internalUserId);
    if (!user) return;

    await this.awardUserExpUseCase.execute(
      new AwardUserExpInput(user.id, UserExpAction.VERIFY_EMAIL),
    );
  }

  private async findUsableToken(value: string): Promise<EmailVerificationToken> {
    const token = await this.tokenRepository.findByValue(value);
    if (!token) throw new InvalidVerificationTokenError("not_found");
    token.ensureUsable();
    return token;
  }
}
