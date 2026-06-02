import { describe, it, expect } from "vitest";
import { readEmailConfig } from "../email.config";

describe("readEmailConfig", () => {
  it("usa el provider 'log' por default cuando no hay env", () => {
    expect(readEmailConfig({}).provider).toBe("log");
  });

  it("lee la config completa de gmail", () => {
    const config = readEmailConfig({
      EMAIL_PROVIDER: "gmail",
      GMAIL_USER: "nico@gmail.com",
      GMAIL_APP_PASSWORD: "abcd efgh ijkl mnop",
      EMAIL_FROM: "PetFinder <nico@gmail.com>",
      APP_BASE_URL: "http://localhost:4200",
    });

    expect(config).toEqual({
      provider: "gmail",
      gmailUser: "nico@gmail.com",
      gmailAppPassword: "abcd efgh ijkl mnop",
      from: "PetFinder <nico@gmail.com>",
      appBaseUrl: "http://localhost:4200",
    });
  });

  it("falla si provider=gmail sin GMAIL_APP_PASSWORD", () => {
    expect(() =>
      readEmailConfig({
        EMAIL_PROVIDER: "gmail",
        GMAIL_USER: "nico@gmail.com",
        EMAIL_FROM: "x",
        APP_BASE_URL: "http://x",
      }),
    ).toThrow();
  });

  it("falla si EMAIL_PROVIDER no es un valor permitido", () => {
    expect(() => readEmailConfig({ EMAIL_PROVIDER: "outlook" })).toThrow();
  });
});
