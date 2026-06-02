import { InvalidEmailError } from "@domain/errors/InvalidEmailError";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailAddress {
  public readonly value: string;

  constructor(value: string) {
    this.value = value.trim().toLowerCase();
    this.validate();
  }

  static create(value: string): EmailAddress {
    return new EmailAddress(value);
  }

  private validate(): void {
    if (!EMAIL_REGEX.test(this.value)) {
      throw new InvalidEmailError(this.value);
    }
  }
}
