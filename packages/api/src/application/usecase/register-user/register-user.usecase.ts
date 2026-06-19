import { User } from "../../../domain/entities/User";
import { EmailVerificationToken } from "../../../domain/entities/EmailVerificationToken";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IEmailVerificationTokenRepository } from "../../../domain/repositories/IEmailVerificationTokenRepository";
import { IPasswordHasher } from "../../../domain/services/IPasswordHasher";
import { ITokenGenerator } from "../../../domain/services/ITokenGenerator";
import { IEmailService } from "../../../domain/services/IEmailService";
import { EmailAddress } from "../../../domain/shared/email/email-address.vo";
import { EmailAlreadyExistsError } from "../../../domain/errors/EmailAlreadyExistsError";
import { RegisterUserInput } from "./register-user.input";
import { RegisterUserOutput } from "./register-user.output";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenRepository: IEmailVerificationTokenRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly emailService: IEmailService,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const email = EmailAddress.create(input.email);
    await this.assertEmailIsAvailable(email);
    const user = await this.saveUser(email, input.username.trim(), input.plainPassword);
    await this.sendVerificationOrRollback(user.requireInternalId(), user.email);
    return new RegisterUserOutput(user.id);
  }

  private async assertEmailIsAvailable(email: EmailAddress): Promise<void> {
    const existing = await this.userRepository.findByEmail(email.value);
    if (existing) throw new EmailAlreadyExistsError(email.value);
  }

  private async saveUser(email: EmailAddress, username: string, plainPassword: string): Promise<User> {
    const passwordHash = await this.passwordHasher.hash(plainPassword);
    return this.userRepository.save(User.create(email, username, passwordHash));
  }

  private async sendVerificationOrRollback(internalUserId: number, email: string): Promise<void> {
    try {
      await this.sendVerification(internalUserId, email);
    } catch (error) {
      await this.userRepository.deleteById(internalUserId);
      throw error;
    }
  }

  private async sendVerification(internalUserId: number, email: string): Promise<void> {
    const tokenValue = await this.issueVerificationToken(internalUserId);
    await this.emailService.sendVerificationLink(email, tokenValue);
  }

  private async issueVerificationToken(userId: number): Promise<string> {
    const tokenValue = this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await this.tokenRepository.save(EmailVerificationToken.create(userId, tokenValue, expiresAt));
    return tokenValue;
  }
}
