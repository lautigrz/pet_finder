import { DomainError } from "@domain/errors/DomainError";

export class CannotReviewYourselfError extends DomainError {
  constructor() {
    super("No podés dejarte una reseña a vos mismo.", "CANNOT_REVIEW_YOURSELF");
  }
}
