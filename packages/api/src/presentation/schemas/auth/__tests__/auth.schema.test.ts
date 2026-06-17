import { describe, it, expect } from "vitest";
import {
  loginRequestSchema,
  logoutRequestSchema,
  refreshRequestSchema,
  forgotPasswordRequestSchema,
  resetPasswordRequestSchema,
} from "../auth.schema";

describe("loginRequestSchema", () => {
  it("acepta un body válido", () => {
    const result = loginRequestSchema.safeParse({
      body: { email: "juan@example.com", password: "miPass123" },
    });
    expect(result.success).toBe(true);
  });

  it("rechaza email faltante", () => {
    const result = loginRequestSchema.safeParse({ body: { password: "miPass123" } });
    expect(result.success).toBe(false);
  });

  it("rechaza email vacío", () => {
    const result = loginRequestSchema.safeParse({ body: { email: "   ", password: "miPass123" } });
    expect(result.success).toBe(false);
  });

  it("rechaza email de más de 255 caracteres", () => {
    const email = "a".repeat(250) + "@x.com";
    const result = loginRequestSchema.safeParse({ body: { email, password: "miPass123" } });
    expect(result.success).toBe(false);
  });

  it("rechaza password faltante", () => {
    const result = loginRequestSchema.safeParse({ body: { email: "juan@example.com" } });
    expect(result.success).toBe(false);
  });

  it("rechaza password de más de 100 caracteres", () => {
    const password = "a".repeat(101);
    const result = loginRequestSchema.safeParse({ body: { email: "juan@example.com", password } });
    expect(result.success).toBe(false);
  });
});

describe("logoutRequestSchema", () => {
  it("acepta un body con refreshToken", () => {
    const result = logoutRequestSchema.safeParse({ body: { refreshToken: "un-token" } });
    expect(result.success).toBe(true);
  });

  it("rechaza refreshToken faltante", () => {
    const result = logoutRequestSchema.safeParse({ body: {} });
    expect(result.success).toBe(false);
  });
});

describe("refreshRequestSchema", () => {
  it("acepta un body con refreshToken", () => {
    const result = refreshRequestSchema.safeParse({ body: { refreshToken: "un-token" } });
    expect(result.success).toBe(true);
  });

  it("rechaza refreshToken vacío", () => {
    const result = refreshRequestSchema.safeParse({ body: { refreshToken: "" } });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordRequestSchema", () => {
  it("acepta un body con email", () => {
    const result = forgotPasswordRequestSchema.safeParse({ body: { email: "juan@example.com" } });
    expect(result.success).toBe(true);
  });

  it("rechaza email faltante", () => {
    const result = forgotPasswordRequestSchema.safeParse({ body: {} });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordRequestSchema", () => {
  it("acepta token y newPassword válidos", () => {
    const result = resetPasswordRequestSchema.safeParse({
      body: { token: "tok-123", newPassword: "nuevaPass123" },
    });
    expect(result.success).toBe(true);
  });

  it("rechaza token faltante", () => {
    const result = resetPasswordRequestSchema.safeParse({ body: { newPassword: "nuevaPass123" } });
    expect(result.success).toBe(false);
  });

  it("rechaza newPassword de menos de 8 caracteres", () => {
    const result = resetPasswordRequestSchema.safeParse({ body: { token: "tok-123", newPassword: "123" } });
    expect(result.success).toBe(false);
  });

  it("rechaza newPassword de más de 100 caracteres", () => {
    const newPassword = "a".repeat(101);
    const result = resetPasswordRequestSchema.safeParse({ body: { token: "tok-123", newPassword } });
    expect(result.success).toBe(false);
  });
});
