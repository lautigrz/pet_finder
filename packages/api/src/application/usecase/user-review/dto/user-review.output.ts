export interface UserReviewOutput {
  id: number;
  reviewerUserId: number;
  reviewedUserId: number;
  rating: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;

  reviewer: {
    id: string;
    username: string;
    name: string | null;
    lastname: string |null;
    photoUrl: string | null;
  };
}

export interface GivenUserReviewOutput {
  id: number;
  reviewerUserId: number;
  reviewedUserId: number;
  rating: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;

  reviewed: {
    id: string;
    username: string;
    name: string | null;
    lastname: string | null;
    photoUrl: string | null;
  };
}

export interface PaginatedUserReviewsOutput {
  items: UserReviewOutput[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedGivenUserReviewsOutput {
  items: GivenUserReviewOutput[];
  page: number;
  pageSize: number;
  total: number;
}

export interface MyUserReviewsOutput {
  received: PaginatedUserReviewsOutput;
  given: PaginatedGivenUserReviewsOutput;
}

export function toUserReviewOutput(review: {
  id: number;
  reviewerUserId: number;
  reviewedUserId: number;
  rating: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewer: {
    id: string;
    username: string;
    name: string | null;
    lastname: string | null;
    photoUrl: string | null;
  };
}): UserReviewOutput {
  return review;
}

export function toGivenUserReviewOutput(review: {
  id: number;
  reviewerUserId: number;
  reviewedUserId: number;
  rating: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewed: {
    id: string;
    username: string;
    name: string | null;
    lastname: string | null;
    photoUrl: string | null;
  };
}): GivenUserReviewOutput {
  return review;
}