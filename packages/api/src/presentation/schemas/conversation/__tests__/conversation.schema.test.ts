import { describe, it, expect } from "vitest";
import { createConversationSchema, getConversationSchema } from "../conversation.schema";

describe("createConversationSchema", () => {
  it("acepta body válido con publicTargetId uuid", () => {
    const result = createConversationSchema.safeParse({
      body: { publicTargetId: "550e8400-e29b-41d4-a716-446655440000" },
    });
    expect(result.success).toBe(true);
  });

  it("rechaza body con publicTargetId que no es uuid", () => {
    const result = createConversationSchema.safeParse({
      body: { publicTargetId: "not-a-uuid" },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza body sin publicTargetId", () => {
    const result = createConversationSchema.safeParse({ body: {} });
    expect(result.success).toBe(false);
  });

  it("rechaza cuando falta el body", () => {
    const result = createConversationSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("getConversationSchema", () => {
  it("acepta params válidos con publicConversationId uuid", () => {
    const result = getConversationSchema.safeParse({
      params: { publicConversationId: "550e8400-e29b-41d4-a716-446655440000" },
    });
    expect(result.success).toBe(true);
  });

  it("rechaza params con publicConversationId que no es uuid", () => {
    const result = getConversationSchema.safeParse({
      params: { publicConversationId: "not-a-uuid" },
    });
    expect(result.success).toBe(false);
  });

  it("rechaza cuando faltan los params", () => {
    const result = getConversationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("acepta query opcional con page y limit numéricos y los transforma a number", () => {
    const result = getConversationSchema.safeParse({
      params: { publicConversationId: "550e8400-e29b-41d4-a716-446655440000" },
      query: { page: "2", limit: "15" }
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query?.page).toBe(2);
      expect(result.data.query?.limit).toBe(15);
    }
  });

  it("rechaza query con page que no es numérico", () => {
    const result = getConversationSchema.safeParse({
      params: { publicConversationId: "550e8400-e29b-41d4-a716-446655440000" },
      query: { page: "abc" }
    });
    expect(result.success).toBe(false);
  });
});
