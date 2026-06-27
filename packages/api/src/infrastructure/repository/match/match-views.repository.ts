import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";
import { MatchViewsRepository } from "@domain/match/repositories/match-views.repository";
import { MatchResultNotFoundError } from "@domain/errors/MatchResultNotFoundError";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";

@injectable()
export class PrismaMatchViewsRepository implements MatchViewsRepository {
  constructor(
    @inject("PrismaClient")
    private readonly prisma: PrismaClient,
  ) {}

  async markSeen(userPublicId: string, matchPublicId: string): Promise<void> {
    const [user, match] = await Promise.all([
      this.prisma.user.findUnique({
        where: { public_id: userPublicId },
        select: { user_id: true },
      }),
      this.prisma.matchResult.findUnique({
        where: { public_id: matchPublicId },
        select: { match_result_id: true },
      }),
    ]);

    if (!user) throw new UserNotFoundError();
    if (!match) throw new MatchResultNotFoundError(matchPublicId);

    await this.prisma.matchView.upsert({
      where: {
        user_id_match_result_id: {
          user_id: user.user_id,
          match_result_id: match.match_result_id,
        },
      },
      create: {
        user_id: user.user_id,
        match_result_id: match.match_result_id,
      },
      update: {},
    });
  }

  async findSeenMatchPublicIdsByUser(userPublicId: string): Promise<string[]> {
    const rows = await this.prisma.matchView.findMany({
      where: { user: { public_id: userPublicId } },
      select: { match_result: { select: { public_id: true } } },
    });

    return rows.map((row) => row.match_result.public_id);
  }
}
