import { describe, it, expect } from "vitest";
import { paymentWebhookSchema } from "../payment-webhook.schema";

describe("paymentWebhookSchema", () => {
  it("acepta la notificacion por body con data.id", () => {
    const result = paymentWebhookSchema.safeParse({
      query: {},
      body: { type: "payment", data: { id: "123456" } },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.data?.id).toBe("123456");
    }
  });

  it("normaliza data.id numerico a string", () => {
    const result = paymentWebhookSchema.safeParse({
      query: {},
      body: { type: "payment", data: { id: 123456 } },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.data?.id).toBe("123456");
    }
  });

  it("acepta la notificacion por query params (type y data.id)", () => {
    const result = paymentWebhookSchema.safeParse({
      query: { type: "payment", "data.id": "123456" },
      body: {},
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query["data.id"]).toBe("123456");
    }
  });
});
