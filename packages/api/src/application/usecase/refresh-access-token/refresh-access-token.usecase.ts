import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { ITokenSigner } from "../../../domain/services/ITokenSigner";
import { InvalidRefreshTokenError } from "../../../domain/errors/InvalidRefreshTokenError";
import { RefreshAccessTokenInput } from "./refresh-access-token.input";
import { RefreshAccessTokenOutput } from "./refresh-access-token.output";

export class RefreshAccessTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly tokenSigner: ITokenSigner,
  ) {}

  async execute(input: RefreshAccessTokenInput): Promise<RefreshAccessTokenOutput> {
    const token = await this.refreshTokenRepository.findByValue(input.refreshToken);
    if (!token || token.isRevoked() || token.isExpired()) {
      throw new InvalidRefreshTokenError();
    }
    const user = await this.userRepository.findById(token.userId);
    if (!user) throw new InvalidRefreshTokenError();
    const accessToken = this.tokenSigner.sign({
      sub: user.id,
      email: user.email,
      isVerified: user.isVerified,
    });
    return new RefreshAccessTokenOutput(accessToken);
  }
}
