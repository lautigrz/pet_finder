import { describe, it, expect } from "vitest";
import { getFilteredReportsSchema } from "../report-filter.schema";

describe("getFilteredReportsSchema", () => {
  it("debería validar con éxito un objeto query vacío", () => {
    const input = { query: {} };
    const result = getFilteredReportsSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toEqual({});
    }
  });

  it("debería validar y transformar parámetros de query válidos", () => {
    const input = {
      query: {
        reportType: "lost",
        animalType: "dog",
        status: "active",
        createdFrom: "2024-05-01",
        createdTo: "2024-05-10",
      },
    };

    const result = getFilteredReportsSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toEqual({
        reportType: "LOST",
        animalType: "DOG",
        status: "ACTIVE",
        createdFrom: "2024-05-01",
        createdTo: "2024-05-10",
      });
    }
  });

  it("debería fallar si el reportType es inválido", () => {
    const input = {
      query: {
        reportType: "INVALID_TYPE",
      },
    };

    const result = getFilteredReportsSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.flatten().fieldErrors["query"];
      expect(issues).toBeDefined();
    }
  });

  it("debería fallar si el animalType es inválido", () => {
    const input = {
      query: {
        animalType: "BIRD",
      },
    };

    const result = getFilteredReportsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("debería fallar si el status es inválido", () => {
    const input = {
      query: {
        status: "EXPIRED",
      },
    };

    const result = getFilteredReportsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("debería fallar si createdFrom o createdTo no son fechas válidas con formato YYYY-MM-DD", () => {
    const input = {
      query: {
        createdFrom: "01-05-2024",
      },
    };

    const result = getFilteredReportsSchema.safeParse(input);
    expect(result.success).toBe(false);

    const input2 = {
      query: {
        createdTo: "not-a-date",
      },
    };

    const result2 = getFilteredReportsSchema.safeParse(input2);
    expect(result2.success).toBe(false);
  });
});
