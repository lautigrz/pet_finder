import { describe, expect, it } from "vitest";
import { registerDeviceTokenSchema, removeDeviceTokenSchema } from "../device-token.schema";

describe("device token schemas", () => {
  describe("registerDeviceTokenSchema", () => {
    it("accepts a non-empty token", () => {
      // Given un body con token válido
      const result = registerDeviceTokenSchema.safeParse({ body: { token: "fcm-token-123" } });

      // Then pasa la validación
      expect(result.success).toBe(true);
    });

    it("rejects an empty token", () => {
      // Given un token vacío
      const result = registerDeviceTokenSchema.safeParse({ body: { token: "" } });

      // Then falla
      expect(result.success).toBe(false);
    });

    it("rejects a missing token", () => {
      // Given un body sin token
      const result = registerDeviceTokenSchema.safeParse({ body: {} });

      // Then falla
      expect(result.success).toBe(false);
    });

    it("rejects a token longer than the maximum length", () => {
      // Given un token excesivamente largo
      const result = registerDeviceTokenSchema.safeParse({ body: { token: "a".repeat(513) } });

      // Then falla
      expect(result.success).toBe(false);
    });
  });

  describe("removeDeviceTokenSchema", () => {
    it("accepts a non-empty token", () => {
      // Given un body con token válido
      const result = removeDeviceTokenSchema.safeParse({ body: { token: "fcm-token-123" } });

      // Then pasa la validación
      expect(result.success).toBe(true);
    });

    it("rejects an empty token", () => {
      // Given un token vacío
      const result = removeDeviceTokenSchema.safeParse({ body: { token: "" } });

      // Then falla
      expect(result.success).toBe(false);
    });
  });
});
