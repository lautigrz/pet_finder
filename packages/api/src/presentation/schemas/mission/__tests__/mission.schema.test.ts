import { describe, it, expect } from "vitest";
import { scoreMissionUpdateRequestSchema } from "../mission.schema";

describe("scoreMissionUpdateRequestSchema", () => {
  it("debe validar correctamente un request de puntuación válido", () => {
    const validData = {
      params: {
        publicId: "a50c822e-1e96-41fa-876a-360ee2e1a909",
      },
      body: {
        points: 25,
      },
    };

    const result = scoreMissionUpdateRequestSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("debe fallar si el publicId no es un UUID válido", () => {
    const invalidData = {
      params: {
        publicId: "invalid-uuid",
      },
      body: {
        points: 25,
      },
    };

    const result = scoreMissionUpdateRequestSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });

  it("debe fallar si los puntos no son un número positivo", () => {
    const invalidData = {
      params: {
        publicId: "a50c822e-1e96-41fa-876a-360ee2e1a909",
      },
      body: {
        points: -10,
      },
    };

    const result = scoreMissionUpdateRequestSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});
