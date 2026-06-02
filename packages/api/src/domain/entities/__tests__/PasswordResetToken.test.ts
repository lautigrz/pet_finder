import { describe, it, expect } from "vitest";
import { PasswordResetToken } from "../PasswordResetToken";

const VALID_VALUE = "a".repeat(64);
const ONE_HOUR = 60 * 60 * 1000;

describe("PasswordResetToken", () => {
  it("crea un token valido con expiracion futura", () => {
    const token = PasswordResetToken.create(42, VALID_VALUE, new Date(Date.now() + ONE_HOUR));
    expect(token.userId).toBe(42);
    expect(token.isUsed()).toBe(false);
    expect(token.isExpired()).toBe(false);
  });

  it("isExpired devuelve true si ya paso la expiracion", () => {
    const token = PasswordResetToken.reconstruct(1, 42, "h", new Date(Date.now() - 1000), null, new Date());
    expect(token.isExpired()).toBe(true);
  });

  it("isUsed devuelve true si tiene usedAt", () => {
    const token = PasswordResetToken.reconstruct(1, 42, "h", new Date(Date.now() + ONE_HOUR), new Date(), new Date());
    expect(token.isUsed()).toBe(true);
  });

  it("lanza si el value es muy corto", () => {
    expect(() => PasswordResetToken.create(42, "short", new Date(Date.now() + ONE_HOUR))).toThrow();
  });

  it("lanza si la expiracion no es futura", () => {
    expect(() => PasswordResetToken.create(42, VALID_VALUE, new Date(Date.now() - 1000))).toThrow();
  });
});
