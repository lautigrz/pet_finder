import { describe, expect, it } from "vitest";
import { User } from "../User";
import { EmailAddress } from "../../shared/email/email-address.vo";

const VALID_HASH = "$2b$10$abcdefghijklmnopqrstuuJ2uVvKc3m1f0q7c8x9z0a1b2c3d4e5f6";

describe("User", () => {
  it("suma experiencia sin mutar la instancia original", () => {
    const user = User.reconstruct(
      1,
      "user-123",
      "user@test.com",
      "usuario",
      VALID_HASH,
      true,
      new Date("2026-01-01"),
      null,
      null,
      null,
      false,
      10,
    );

    const updated = user.addExperience(5);

    expect(user.exp).toBe(10);
    expect(updated.exp).toBe(15);
  });

  it("rechaza montos de experiencia invalidos", () => {
    const user = User.reconstruct(
      1,
      "user-123",
      "user@test.com",
      "usuario",
      VALID_HASH,
      true,
      new Date("2026-01-01"),
      null,
      null,
      null,
    );

    expect(() => user.addExperience(0)).toThrow("positive integer");
    expect(() => user.addExperience(1.5)).toThrow("positive integer");
  });

  describe("createFromGoogle", () => {
    const email = EmailAddress.create("juan@example.com");

    it("crea un usuario verificado, sin password y con googleId", () => {
      const user = User.createFromGoogle(email, "juan", "google-sub-1", "https://pic");

      expect(user.passwordHash).toBeNull();
      expect(user.isVerified).toBe(true);
      expect(user.googleId).toBe("google-sub-1");
      expect(user.photoUrl).toBe("https://pic");
    });

    it("rechaza un username invalido", () => {
      expect(() => User.createFromGoogle(email, "ab", "google-sub-1", null)).toThrow();
    });
  });
});
