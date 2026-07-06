import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import type { IUserReviewRepository } from "@domain/repositories/IUserReviewRepository";
import { UserNotFoundError } from "@domain/errors/UserNotFoundError";
import {
  PaginatedUserReviewsOutput,
  toUserReviewOutput,
} from "./dto/user-review.output";

@injectable()
export class ListPublicUserReviewsUseCase {
  constructor(
    @inject("UserRepository")
    private readonly userRepository: IUserRepository,

    @inject("UserReviewRepository")
    private readonly userReviewRepository: IUserReviewRepository,
  ) {}

  async execute(input: {
    publicId: string;
    page: number;
    pageSize: number;
  }): Promise<PaginatedUserReviewsOutput> {
    const user = await this.userRepository.findByPublicId(input.publicId);

    if (!user || user.isSuspended) {
      throw new UserNotFoundError();
    }

    const page = Math.max(1, input.page);
    const pageSize = Math.min(50, Math.max(1, input.pageSize));

    const received = await this.userReviewRepository.findByReviewedUserId({
      reviewedUserId: user.requireInternalId(),
      page,
      pageSize,
    });

    return {
      items: received.items.map(toUserReviewOutput),
      page: received.page,
      pageSize: received.pageSize,
      total: received.total,
    };
  }
}