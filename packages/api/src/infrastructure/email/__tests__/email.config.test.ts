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

  it("lee la config completa de sendgrid", () => {
    const config = readEmailConfig({
      EMAIL_PROVIDER: "sendgrid",
      SENDGRID_API_KEY: "SG.test-key",
      EMAIL_FROM: "PetFinder <nico@gmail.com>",
      APP_BASE_URL: "https://front.vercel.app",
    });

    expect(config).toEqual({
      provider: "sendgrid",
      sendgridApiKey: "SG.test-key",
      from: "PetFinder <nico@gmail.com>",
      appBaseUrl: "https://front.vercel.app",
    });
  });

  it("falla si provider=sendgrid sin SENDGRID_API_KEY", () => {
    expect(() =>
      readEmailConfig({
        EMAIL_PROVIDER: "sendgrid",
        EMAIL_FROM: "x",
        APP_BASE_URL: "https://x",
      }),
    ).toThrow();
  });

  it("falla si EMAIL_PROVIDER no es un valor permitido", () => {
    expect(() => readEmailConfig({ EMAIL_PROVIDER: "outlook" })).toThrow();
  });
});
