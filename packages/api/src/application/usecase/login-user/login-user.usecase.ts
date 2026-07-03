import { RefreshToken } from "../../../domain/entities/RefreshToken";
import { User } from "../../../domain/entities/User";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository";
import type { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import type { IPasswordHasher } from "../../../domain/services/IPasswordHasher";
import type { ITokenSigner } from "../../../domain/services/ITokenSigner";
import type { ITokenGenerator } from "../../../domain/services/ITokenGenerator";
import { accessTokenPayloadFor } from "../../../domain/auth/access-token-payload";
import { EmailAddress } from "../../../domain/shared/email/email-address.vo";
import { InvalidCredentialsError } from "../../../domain/errors/InvalidCredentialsError";
import { UserSuspendedError } from "../../../domain/errors/UserSuspendedError";
import { LoginUserInput } from "./login-user.input";
import { LoginUserOutput } from "./login-user.output";
import { injectable, inject } from "tsyringe";

@injectable()
export class LoginUserUseCase {
  constructor(
    @inject("UserRepository")
    private readonly userRepository: IUserRepository,
    @inject("RefreshTokenRepository")
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @inject("PasswordHasher")
    private readonly passwordHasher: IPasswordHasher,
    @inject("TokenSigner")
    private readonly tokenSigner: ITokenSigner,
    @inject("TokenGenerator")
    private readonly tokenGenerator: ITokenGenerator,
    @inject("RefreshTtlMs")
    private readonly refreshTtlMs: number,
  ) { }

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.findUserByEmail(input.email);
    await this.assertPasswordMatches(input.plainPassword, user.passwordHash);
    if (user.isSuspended) throw new UserSuspendedError();
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
