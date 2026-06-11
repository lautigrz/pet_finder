import { randomUUID } from "node:crypto";
import { InvalidEmailError } from "../errors/InvalidEmailError";
import { InvalidPasswordHashError } from "../errors/InvalidPasswordHashError";
import { InvalidUsernameError } from "../errors/InvalidUsernameError";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[\p{L}\d_\s]+$/u;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const BCRYPT_HASH_MIN_LENGTH = 60;

export class User {
  private constructor(
    public readonly internalId: number | null,
    public readonly id: string,
    public readonly email: string,
    public readonly username: string,
    public readonly passwordHash: string,
    public readonly isVerified: boolean,
    public readonly createdAt: Date,
    public readonly name: string | null,
    public readonly lastname: string | null,
    public readonly photoUrl: string | null,
    public readonly notificationRadius: number,
  ) {}

  static create(email: string, username: string, passwordHash: string): User {
    User.assertValidEmail(email);
    User.assertValidUsername(username);
    User.assertValidPasswordHash(passwordHash);
    return new User(null, randomUUID(), email, username, passwordHash, false, new Date(), null, null, null,5);
  }

  static reconstruct(
    internalId: number,
    id: string,
    email: string,
    username: string,
    passwordHash: string,
    isVerified: boolean,
    createdAt: Date,
    name: string | null,
    lastname: string | null,
    photoUrl: string | null,
    notificationRadius: number
  ): User {
    return new User(internalId, id, email, username, passwordHash, isVerified, createdAt,name, lastname, photoUrl,notificationRadius);
  }

  private static assertValidEmail(email: string): void {
    if (!EMAIL_REGEX.test(email)) throw new InvalidEmailError(email);
  }

  private static assertValidUsername(username: string): void {
    if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
      throw new InvalidUsernameError(
        `Username must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters`,
      );
    }
    if (!USERNAME_REGEX.test(username)) {
      throw new InvalidUsernameError(
        "Username can only contain letters, numbers, underscore and spaces",
      );
    }
  }

  private static assertValidPasswordHash(hash: string): void {
    if (hash.length < BCRYPT_HASH_MIN_LENGTH) throw new InvalidPasswordHashError();
  }
}
