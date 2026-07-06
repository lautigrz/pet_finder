import { DomainError } from "@domain/errors/DomainError";

export class InvalidUserReviewRatingError extends DomainError {
  constructor() {
    super("La calificación debe estar entre 1 y 5.", "INVALID_USER_REVIEW_RATING");
  }
}
