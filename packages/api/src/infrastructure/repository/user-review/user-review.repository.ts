import { Prisma, PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";
import type {
  GivenUserReviewData,
  IUserReviewRepository,
  PaginatedGivenUserReviews,
  PaginatedUserReviews,
  UserRatingSummary,
  UserReviewData,
} from "@domain/repositories/IUserReviewRepository";

const reviewerInclude = {
  reviewer: {
    select: {
      public_id: true,
      username: true,
      name: true,
      lastname: true,
      photo_url: true,
    },
  },
} satisfies Prisma.UserReviewInclude;

const reviewedInclude = {
  reviewed: {
    select: {
      public_id: true,
      username: true,
      name: true,
      lastname: true,
      photo_url: true,
    },
  },
} satisfies Prisma.UserReviewInclude;

type ReviewWithReviewer = Prisma.UserReviewGetPayload<{
  include: typeof reviewerInclude;
}>;

type ReviewWithReviewed = Prisma.UserReviewGetPayload<{
  include: typeof reviewedInclude;
}>;

@injectable()
export class PrismaUserReviewRepository implements IUserReviewRepository {
  constructor(@inject("PrismaClient") private readonly prisma: PrismaClient) {}

  async upsert(input: {
    reviewerUserId: number;
    reviewedUserId: number;
    rating: number;
    description?: string | null;
  }): Promise<UserReviewData> {
    const record = await this.prisma.userReview.upsert({
      where: {
        reviewer_user_id_reviewed_user_id: {
          reviewer_user_id: input.reviewerUserId,
          reviewed_user_id: input.reviewedUserId,
        },
      },
      create: {
        reviewer_user_id: input.reviewerUserId,
        reviewed_user_id: input.reviewedUserId,
        rating: input.rating,
        description: input.description ?? null,
      },
      update: {
        rating: input.rating,
        description: input.description ?? null,
      },
      include: reviewerInclude,
    });

    return this.toReceivedData(record);
  }

  async findByReviewedUserId(input: {
    reviewedUserId: number;
    page: number;
    pageSize: number;
  }): Promise<PaginatedUserReviews> {
    const where = {
      reviewed_user_id: input.reviewedUserId,
      reviewer: { is_suspended: false },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.userReview.findMany({
        where,
        include: reviewerInclude,
        orderBy: { created_at: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.userReview.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toReceivedData(item)),
      page: input.page,
      pageSize: input.pageSize,
      total,
    };
  }

  async findByReviewerUserId(input: {
    reviewerUserId: number;
    page: number;
    pageSize: number;
  }): Promise<PaginatedGivenUserReviews> {
    const where = {
      reviewer_user_id: input.reviewerUserId,
      reviewed: { is_suspended: false },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.userReview.findMany({
        where,
        include: reviewedInclude,
        orderBy: { created_at: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.userReview.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toGivenData(item)),
      page: input.page,
      pageSize: input.pageSize,
      total,
    };
  }

  async getRatingSummary(reviewedUserId: number): Promise<UserRatingSummary> {
    const result = await this.prisma.userReview.aggregate({
      where: {
        reviewed_user_id: reviewedUserId,
        reviewer: { is_suspended: false },
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      average: result._avg.rating ? Number(result._avg.rating.toFixed(2)) : 0,
      count: result._count.rating,
    };
  }

  private toReceivedData(record: ReviewWithReviewer): UserReviewData {
    return {
      id: record.user_review_id,
      reviewerUserId: record.reviewer_user_id,
      reviewedUserId: record.reviewed_user_id,
      rating: record.rating,
      description: record.description,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      reviewer: {
        id: record.reviewer.public_id,
        username: record.reviewer.username,
        name: record.reviewer.name,
        lastname: record.reviewer.lastname,
        photoUrl: record.reviewer.photo_url,
      },
    };
  }

  private toGivenData(record: ReviewWithReviewed): GivenUserReviewData {
    return {
      id: record.user_review_id,
      reviewerUserId: record.reviewer_user_id,
      reviewedUserId: record.reviewed_user_id,
      rating: record.rating,
      description: record.description,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      reviewed: {
        id: record.reviewed.public_id,
        username: record.reviewed.username,
        name: record.reviewed.name,
        lastname: record.reviewed.lastname,
        photoUrl: record.reviewed.photo_url,
      },
    };
  }
}