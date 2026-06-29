import { describe, it, expect, afterEach } from "vitest";
import { createEmailService } from "../email-service.factory";
import { LogEmailService } from "../LogEmailService";
import { NodemailerEmailService } from "../NodemailerEmailService";
import { SendgridEmailService } from "../SendgridEmailService";

describe("createEmailService", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("devuelve LogEmailService cuando no hay EMAIL_PROVIDER (default log)", () => {
    delete process.env.EMAIL_PROVIDER;
    expect(createEmailService()).toBeInstanceOf(LogEmailService);
  });

  it("devuelve NodemailerEmailService cuando EMAIL_PROVIDER=gmail con su config", () => {
    process.env.EMAIL_PROVIDER = "gmail";
    process.env.GMAIL_USER = "nico@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
    process.env.EMAIL_FROM = "PetFinder <nico@gmail.com>";
    process.env.APP_BASE_URL = "http://localhost:4200";

    expect(createEmailService()).toBeInstanceOf(NodemailerEmailService);
  });

  it("devuelve SendgridEmailService cuando EMAIL_PROVIDER=sendgrid con su config", () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "SG.test-key";
    process.env.EMAIL_FROM = "PetFinder <nico@gmail.com>";
    process.env.APP_BASE_URL = "https://front.vercel.app";

    expect(createEmailService()).toBeInstanceOf(SendgridEmailService);
  });
});
