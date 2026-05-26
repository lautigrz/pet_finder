export class ValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid input: ${issues.join("; ")}`);
    this.name = "ValidationError";
  }
}
