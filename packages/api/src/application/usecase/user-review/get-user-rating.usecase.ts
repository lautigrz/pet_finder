import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import type { UserReviewRepository } from "@domain/repositories/IUserReviewRepository";
import { UserRatingOutput } from "./dto/user-review.output";

@injectable()
export class GetUserRatingUseCase {
  constructor(
    @inject("UserRepository") private readonly userRepository: IUserRepository,
    @inject("UserReviewRepository")
    private readonly userReviewRepository: UserReviewRepository,
  ) {}

  async execute(reviewedPublicId: string): Promise<UserRatingOutput> {
    const reviewed = await this.userRepository.findByPublicId(reviewedPublicId);
    if (!reviewed || reviewed.isSuspended) throw new UserNotFoundError();

    return this.userReviewRepository.getRatingSummary(
      reviewed.requireInternalId(),
    );
  }
}
