export interface UserReviewData {
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
}

export interface GivenUserReviewData {
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

export interface UserRatingSummary {
  average: number;
  count: number;
}

export interface PaginatedUserReviews {
  items: UserReviewData[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedGivenUserReviews {
  items: GivenUserReviewData[];
  page: number;
  pageSize: number;
  total: number;
}

export interface IUserReviewRepository {
  upsert(input: {
    reviewerUserId: number;
    reviewedUserId: number;
    rating: number;
    description?: string | null;
  }): Promise<UserReviewData>;

  findByReviewedUserId(input: {
    reviewedUserId: number;
    page: number;
    pageSize: number;
  }): Promise<PaginatedUserReviews>;

  findByReviewerUserId(input: {
    reviewerUserId: number;
    page: number;
    pageSize: number;
  }): Promise<PaginatedGivenUserReviews>;

  getRatingSummary(reviewedUserId: number): Promise<UserRatingSummary>;
}