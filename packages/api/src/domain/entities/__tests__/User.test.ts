import { describe, expect, it } from "vitest";
import { User } from "../User";

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
});
