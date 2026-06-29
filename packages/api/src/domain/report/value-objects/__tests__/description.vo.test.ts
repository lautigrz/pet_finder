import { describe, it, expect } from "vitest";
import { ReportDescription } from "../description.vo";
import { InvalidReportDescriptionError } from "@domain/errors/InvalidReportDescriptionError";

describe("ReportDescription", () => {
  describe("create — valores válidos", () => {
    it("crea una descripción con texto válido", () => {

      const desc = ReportDescription.create("Mi perro se perdió cerca del parque central");


      expect(desc.value).toBe("Mi perro se perdió cerca del parque central");
    });

    it("acepta una descripción de exactamente 1000 caracteres", () => {
      const text = "a".repeat(1000);
      const desc = ReportDescription.create(text);
      expect(desc.value).toHaveLength(1000);
    });
  });

  describe("create — valores inválidos", () => {
    it("lanza InvalidReportDescriptionError si la descripción está vacía", () => {

      expect(() => ReportDescription.create("")).toThrow(
        InvalidReportDescriptionError
      );
    });

    it("lanza InvalidReportDescriptionError si la descripción es solo espacios", () => {
      expect(() => ReportDescription.create("   ")).toThrow(
        InvalidReportDescriptionError
      );
    });

    it("lanza InvalidReportDescriptionError si la descripción supera 1000 caracteres", () => {
      const text = "a".repeat(1001);
      expect(() => ReportDescription.create(text)).toThrow(
        InvalidReportDescriptionError
      );
    });
  });

  describe("constructor directo", () => {
    it("crea la misma instancia que el factory method", () => {
      const desc1 = new ReportDescription("descripción de prueba");
      const desc2 = ReportDescription.create("descripción de prueba");
      expect(desc1.value).toBe(desc2.value);
    });
  });
});
