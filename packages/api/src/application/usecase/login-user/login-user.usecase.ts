import { RefreshToken } from "../../../domain/entities/RefreshToken";
import { User } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { IPasswordHasher } from "../../../domain/services/IPasswordHasher";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";
import { ITokenGenerator } from "../../../domain/services/ITokenGenerator";
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
    const user = await this.findVerifiedUser(input.email);
    await this.assertPasswordMatches(input.plainPassword, user.passwordHash);
    const accessToken = this.issueAccessToken(user);
    const refreshToken = await this.issueRefreshToken(user.internalId!);
    return new LoginUserOutput(accessToken, refreshToken);
  }

  private async findVerifiedUser(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email.trim().toLowerCase());
    if (!user) throw new InvalidCredentialsError();
    return user;
  }

  private async assertPasswordMatches(plain: string, hash: string): Promise<void> {
    const matches = await this.passwordHasher.verify(plain, hash);
    if (!matches) throw new InvalidCredentialsError();
  }

  private issueAccessToken(user: User): string {
    return this.tokenSigner.sign({
      sub: user.id,
      email: user.email,
      isVerified: user.isVerified,
    });
  }

  private async issueRefreshToken(internalUserId: number): Promise<string> {
    const value = this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);
    const token = RefreshToken.create(internalUserId, value, expiresAt);
    await this.refreshTokenRepository.save(token);
    return value;
  }
}
