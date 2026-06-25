import type { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import { LogoutUserInput } from "./logout-user.input";
import { inject, injectable } from "tsyringe";

@injectable()
export class LogoutUserUseCase {
  constructor(
    @inject("RefreshTokenRepository")
    private readonly refreshTokenRepository: IRefreshTokenRepository
  ) { }

  async execute(input: LogoutUserInput): Promise<void> {
    const token = await this.refreshTokenRepository.findByValue(input.refreshToken);
    if (!token || token.isRevoked()) return;
    await this.refreshTokenRepository.revoke(token.requireId(), new Date());
  }
}
