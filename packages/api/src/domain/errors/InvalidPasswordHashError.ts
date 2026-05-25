export class InvalidPasswordHashError extends Error {
  constructor() {
    super("Invalid password hash");
    this.name = "InvalidPasswordHashError";
  }
}
