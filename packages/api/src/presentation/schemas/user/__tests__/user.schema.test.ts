import { describe, it, expect } from "vitest";
import { createUserRequestSchema, verifyEmailRequestSchema } from "../user.schema";

describe("createUserRequestSchema", () => {
  const validBody = { email: "juan@example.com", username: "juancho", password: "miPass123" };

  it("acepta un body válido", () => {
    const result = createUserRequestSchema.safeParse({ body: validBody });
    expect(result.success).toBe(true);
  });

  it("rechaza email faltante", () => {
    const result = createUserRequestSchema.safeParse({
      body: { username: "juancho", password: "miPass123" },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza email vacío", () => {
    const result = createUserRequestSchema.safeParse({ body: { ...validBody, email: "   " } });
    expect(result.success).toBe(false);
  });

  it("rechaza username faltante", () => {
    const result = createUserRequestSchema.safeParse({
      body: { email: "juan@example.com", password: "miPass123" },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza username de más de 30 caracteres", () => {
    const result = createUserRequestSchema.safeParse({
      body: { ...validBody, username: "a".repeat(31) },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza password de menos de 8 caracteres", () => {
    const result = createUserRequestSchema.safeParse({ body: { ...validBody, password: "123" } });
    expect(result.success).toBe(false);
  });

  it("rechaza password de más de 100 caracteres", () => {
    const result = createUserRequestSchema.safeParse({
      body: { ...validBody, password: "a".repeat(101) },
    });
    expect(result.success).toBe(false);
  });
});

describe("verifyEmailRequestSchema", () => {
  it("acepta un body con token", () => {
    const result = verifyEmailRequestSchema.safeParse({ body: { token: "valid-token-string" } });
    expect(result.success).toBe(true);
  });

  it("rechaza token faltante", () => {
    const result = verifyEmailRequestSchema.safeParse({ body: {} });
    expect(result.success).toBe(false);
  });

  it("rechaza token vacío", () => {
    const result = verifyEmailRequestSchema.safeParse({ body: { token: "" } });
    expect(result.success).toBe(false);
  });
});
