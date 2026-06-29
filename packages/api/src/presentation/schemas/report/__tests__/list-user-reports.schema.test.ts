import { describe, it, expect } from "vitest";
import { listUserReportsSchema } from "../list-user-reports.schema";

describe("listUserReportsSchema", () => {
  it("aplica defaults de page y limit cuando no vienen", () => {
    const result = listUserReportsSchema.safeParse({
      query: {},
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.query.page).toBe(1);
      expect(result.data.query.limit).toBe(10);
    }
  });

  it("rechaza page menor a 1", () => {
    const result = listUserReportsSchema.safeParse({
      query: {
        page: "0",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rechaza limit mayor a 100", () => {
    const result = listUserReportsSchema.safeParse({
      query: {
        limit: "200",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rechaza reportType inválido", () => {
    const result = listUserReportsSchema.safeParse({
      query: {
        reportType: "PEPE",
      },
    });

    expect(result.success).toBe(false);
  });

  it("normaliza tipos, coacciona números y recorta q", () => {
    const result = listUserReportsSchema.safeParse({
      query: {
        reportType: "lost",
        animalType: "dog",
        lat: "-34.6",
        lng: "-58.3",
        radiusKm: "5",
        q: "  collar rojo  ",
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.query.reportType).toBe("LOST");
      expect(result.data.query.animalType).toBe("DOG");
      expect(result.data.query.radiusKm).toBe(5);
      expect(result.data.query.q).toBe("collar rojo");
    }
  });

  it("acepta una búsqueda de al menos 2 caracteres", () => {
    const result = listUserReportsSchema.safeParse({
      query: {
        q: "pe",
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.query.q).toBe("pe");
    }
  });

  it("rechaza una búsqueda de menos de 2 caracteres", () => {
    const result = listUserReportsSchema.safeParse({
      query: {
        q: "p",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rechaza una búsqueda mayor a 100 caracteres", () => {
    const result = listUserReportsSchema.safeParse({
      query: {
        q: "a".repeat(101),
      },
    });

    expect(result.success).toBe(false);
  });

  it("rechaza q con solo espacios después de aplicar trim", () => {
    const result = listUserReportsSchema.safeParse({
      query: {
        q: "   ",
      },
    });

    expect(result.success).toBe(false);
  });
});