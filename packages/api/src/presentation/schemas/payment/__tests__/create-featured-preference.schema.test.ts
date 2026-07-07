import { describe, it, expect } from "vitest";
import { createFeaturedPreferenceSchema } from "../create-featured-preference.schema";

describe("createFeaturedPreferenceSchema", () => {
  it("acepta un publicId con formato UUID valido", () => {
    const result = createFeaturedPreferenceSchema.safeParse({
      params: { publicId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301" },
    });

    expect(result.success).toBe(true);
  });

  it("rechaza un publicId que no es UUID", () => {
    const result = createFeaturedPreferenceSchema.safeParse({
      params: { publicId: "no-es-uuid" },
    });

    expect(result.success).toBe(false);
  });
});
