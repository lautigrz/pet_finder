import { randomUUID } from "node:crypto";
import { InvalidEmailError } from "../errors/InvalidEmailError";
import { InvalidPasswordHashError } from "../errors/InvalidPasswordHashError";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_HASH_MIN_LENGTH = 60;

export class User {
  private constructor(
    public readonly internalId: number | null,
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly isVerified: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(email: string, passwordHash: string): User {
    User.assertValidEmail(email);
    User.assertValidPasswordHash(passwordHash);
    return new User(null, randomUUID(), email, passwordHash, false, new Date());
  }

  static reconstruct(
    internalId: number,
    id: string,
    email: string,
    passwordHash: string,
    isVerified: boolean,
    createdAt: Date,
  ): User {
    return new User(internalId, id, email, passwordHash, isVerified, createdAt);
  }

  private static assertValidEmail(email: string): void {
    if (!EMAIL_REGEX.test(email)) throw new InvalidEmailError(email);
  }

  private static assertValidPasswordHash(hash: string): void {
    if (hash.length < BCRYPT_HASH_MIN_LENGTH) throw new InvalidPasswordHashError();
  }
}
