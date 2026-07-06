import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import type { IUserReviewRepository } from "@domain/repositories/IUserReviewRepository";
import { CannotReviewYourselfError } from "@domain/errors/CannotReviewYourselfError";
import { InvalidUserReviewRatingError } from "@domain/errors/InvalidUserReviewRatingError";
import { UserReviewOutput, toUserReviewOutput } from "./dto/user-review.output";

@injectable()
export class UpsertUserReviewUseCase {
  constructor(
    @inject("UserRepository") private readonly userRepository: IUserRepository,
    @inject("UserReviewRepository")
    private readonly userReviewRepository: IUserReviewRepository,
  ) {}

  async execute(input: {
    reviewerPublicId: string;
    reviewedPublicId: string;
    rating: number;
    description?: string | null;
  }): Promise<UserReviewOutput> {
    if (
      !Number.isInteger(input.rating) ||
      input.rating < 1 ||
      input.rating > 5
    ) {
      throw new InvalidUserReviewRatingError();
    }

    if (input.reviewerPublicId === input.reviewedPublicId) {
      throw new CannotReviewYourselfError();
    }

    const [reviewer, reviewed] = await Promise.all([
      this.userRepository.findByPublicId(input.reviewerPublicId),
      this.userRepository.findByPublicId(input.reviewedPublicId),
    ]);

    if (
      !reviewer ||
      reviewer.isSuspended ||
      !reviewed ||
      reviewed.isSuspended
    ) {
      throw new UserNotFoundError();
    }

    const review = await this.userReviewRepository.upsert({
      reviewerUserId: reviewer.requireInternalId(),
      reviewedUserId: reviewed.requireInternalId(),
      rating: input.rating,
      description: input.description?.trim() || null,
    });

    return toUserReviewOutput(review);
  }
}
