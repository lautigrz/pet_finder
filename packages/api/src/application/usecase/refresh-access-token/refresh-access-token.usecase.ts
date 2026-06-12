import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";
import { accessTokenPayloadFor } from "../../../domain/services/access-token-payload";
import { InvalidRefreshTokenError } from "../../../domain/errors/InvalidRefreshTokenError";
import { RefreshToken } from "../../../domain/entities/RefreshToken";
import { User } from "../../../domain/entities/User";
import { RefreshAccessTokenInput } from "./refresh-access-token.input";
import { RefreshAccessTokenOutput } from "./refresh-access-token.output";

export class RefreshAccessTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly tokenSigner: ITokenSigner,
  ) {}

  async execute(input: RefreshAccessTokenInput): Promise<RefreshAccessTokenOutput> {
    const token = await this.findActiveToken(input.refreshToken);
    const user = await this.findTokenOwner(token.userId);
    return new RefreshAccessTokenOutput(this.tokenSigner.sign(accessTokenPayloadFor(user)));
  }

  private async findActiveToken(value: string): Promise<RefreshToken> {
    const token = await this.refreshTokenRepository.findByValue(value);
    if (!token || !token.isActive()) throw new InvalidRefreshTokenError();
    return token;
  }

  private async findTokenOwner(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new InvalidRefreshTokenError();
    return user;
  }
}
