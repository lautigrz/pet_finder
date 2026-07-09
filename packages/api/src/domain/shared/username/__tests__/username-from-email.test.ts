import { describe, it, expect } from "vitest";
import { usernameFromEmail } from "../username-from-email";

describe("usernameFromEmail", () => {
  it("uses the email local part as the username", () => {
    expect(usernameFromEmail("juan@example.com")).toBe("juan");
  });

  it("strips characters that are not allowed in usernames", () => {
    expect(usernameFromEmail("juan.perez-99@example.com")).toBe("juanperez99");
  });

  it("truncates to the maximum username length", () => {
    const longLocalPart = "a".repeat(40) + "@example.com";
    expect(usernameFromEmail(longLocalPart)).toHaveLength(30);
  });

  it("falls back to a default when the cleaned local part is too short", () => {
    expect(usernameFromEmail("a.b@example.com")).toBe("usuario");
  });
});
