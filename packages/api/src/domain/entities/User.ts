import { randomUUID } from "node:crypto";
import { EmailAddress } from "../shared/email/email-address.vo";
import { InvalidPasswordHashError } from "../errors/InvalidPasswordHashError";
import { InvalidUsernameError } from "../errors/InvalidUsernameError";

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
    public readonly isSuspended: boolean,
    public readonly exp: number,
  ) {}

  static create(email: EmailAddress, username: string, passwordHash: string): User {
    User.assertValidUsername(username);
    User.assertValidPasswordHash(passwordHash);
    return new User(null, randomUUID(), email.value, username, passwordHash, false, new Date(), null, null, null, false, 0);
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
    isSuspended = false,
    exp = 0,
  ): User {
    return new User(internalId, id, email, username, passwordHash, isVerified, createdAt, name, lastname, photoUrl, isSuspended, exp);
  }

  requireInternalId(): number {
    if (this.internalId === null) throw new Error("User is not persisted");
    return this.internalId;
  }

  addExperience(amount: number): User {
    User.assertValidExperienceAmount(amount);
    return new User(
      this.internalId,
      this.id,
      this.email,
      this.username,
      this.passwordHash,
      this.isVerified,
      this.createdAt,
      this.name,
      this.lastname,
      this.photoUrl,
      this.isSuspended,
      this.exp + amount,
    );
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

  private static assertValidExperienceAmount(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Experience amount must be a positive integer");
    }
  }
}
