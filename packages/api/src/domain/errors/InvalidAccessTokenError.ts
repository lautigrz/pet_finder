export class InvalidAccessTokenError extends Error {
  constructor() {
    super("Invalid or expired access token");
    this.name = "InvalidAccessTokenError";
  }
}
