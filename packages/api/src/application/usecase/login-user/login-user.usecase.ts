import { RefreshToken } from "../../../domain/entities/RefreshToken";
import { User } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { IPasswordHasher } from "../../../domain/services/IPasswordHasher";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";
import { ITokenGenerator } from "../../../domain/services/ITokenGenerator";
import { accessTokenPayloadFor } from "../../../domain/auth/access-token-payload";
import { EmailAddress } from "../../../domain/shared/email/email-address.vo";
import { InvalidCredentialsError } from "../../../domain/errors/InvalidCredentialsError";
import { LoginUserInput } from "./login-user.input";
import { LoginUserOutput } from "./login-user.output";

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenSigner: ITokenSigner,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly refreshTtlMs: number,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.findUserByEmail(input.email);
    await this.assertPasswordMatches(input.plainPassword, user.passwordHash);
    const accessToken = this.tokenSigner.sign(accessTokenPayloadFor(user));
    return new LoginUserOutput(accessToken, await this.issueRefreshToken(user.requireInternalId()));
  }

  private async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(EmailAddress.create(email).value);
    if (!user) throw new InvalidCredentialsError();
    return user;
  }

  private async assertPasswordMatches(plain: string, hash: string): Promise<void> {
    const matches = await this.passwordHasher.verify(plain, hash);
    if (!matches) throw new InvalidCredentialsError();
  }

  private async issueRefreshToken(internalUserId: number): Promise<string> {
    const value = this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);
    await this.refreshTokenRepository.save(RefreshToken.create(internalUserId, value, expiresAt));
    return value;
  }
}
