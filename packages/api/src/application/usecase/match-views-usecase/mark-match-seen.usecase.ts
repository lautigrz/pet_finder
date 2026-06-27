import { inject, injectable } from "tsyringe";
import type { MatchViewsRepository } from "@domain/match/repositories/match-views.repository";

@injectable()
export class MarkMatchSeenUseCase {
  constructor(
    @inject("MatchViewsRepository")
    private readonly matchViewsRepository: MatchViewsRepository,
  ) {}

  async execute(userPublicId: string, matchPublicId: string): Promise<void> {
    await this.matchViewsRepository.markSeen(userPublicId, matchPublicId);
  }
}
