import { inject, injectable } from "tsyringe";
import type { MatchViewsRepository } from "@domain/match/repositories/match-views.repository";

@injectable()
export class GetSeenMatchesUseCase {
  constructor(
    @inject("MatchViewsRepository")
    private readonly matchViewsRepository: MatchViewsRepository,
  ) {}

  async execute(userPublicId: string): Promise<string[]> {
    return this.matchViewsRepository.findSeenMatchPublicIdsByUser(userPublicId);
  }
}
