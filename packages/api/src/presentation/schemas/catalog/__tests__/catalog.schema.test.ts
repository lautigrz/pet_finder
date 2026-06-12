import { describe, it, expect } from "vitest";
import { getBreedsRequestSchema } from "../catalog.schema";

describe("getBreedsRequestSchema", () => {
  it("acepta query sin animalType", () => {
    const result = getBreedsRequestSchema.safeParse({ query: {} });
    expect(result.success).toBe(true);
  });

  it("normaliza animalType a mayúsculas", () => {
    const result = getBreedsRequestSchema.safeParse({ query: { animalType: "dog" } });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query.animalType).toBe("DOG");
    }
  });

  it("acepta CAT como animalType", () => {
    const result = getBreedsRequestSchema.safeParse({ query: { animalType: "CAT" } });
    expect(result.success).toBe(true);
  });

  it("rechaza animalType inválido", () => {
    const result = getBreedsRequestSchema.safeParse({ query: { animalType: "PEPE" } });
    expect(result.success).toBe(false);
  });
});
