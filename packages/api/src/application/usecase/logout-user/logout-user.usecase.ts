import { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { LogoutUserInput } from "./logout-user.input";

export class LogoutUserUseCase {
  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(input: LogoutUserInput): Promise<void> {
    const token = await this.refreshTokenRepository.findByValue(input.refreshToken);
    if (!token || token.isRevoked()) return;
    await this.refreshTokenRepository.revoke(token.id!, new Date());
  }
}
