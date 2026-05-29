import { describe, it, expect } from "vitest";
import { Coordinates } from "../coordinates.vo";
import { InvalidCoordinatesError } from "../../../errors/InvalidCoordinatesError";

describe("Coordinates", () => {
  describe("constructor — valores válidos", () => {
    it("crea coordenadas válidas en el ecuador meridiano principal", () => {
      // Given lat=0, lng=0
      const coords = new Coordinates(0, 0);

      // Then los getters devuelven los valores
      expect(coords.latitude).toBe(0);
      expect(coords.longitude).toBe(0);
    });

    it("acepta los valores extremos: lat -90, lng -180", () => {
      const coords = new Coordinates(-90, -180);
      expect(coords.latitude).toBe(-90);
      expect(coords.longitude).toBe(-180);
    });

    it("acepta los valores extremos: lat 90, lng 180", () => {
      const coords = new Coordinates(90, 180);
      expect(coords.latitude).toBe(90);
      expect(coords.longitude).toBe(180);
    });

    it("acepta coordenadas de Buenos Aires", () => {
      const coords = new Coordinates(-34.603722, -58.381592);
      expect(coords.latitude).toBe(-34.603722);
      expect(coords.longitude).toBe(-58.381592);
    });
  });

  describe("constructor — valores inválidos", () => {
    it("lanza InvalidCoordinatesError si la latitud supera 90", () => {
      // Given latitud > 90
      // When/Then
      expect(() => new Coordinates(91, 0)).toThrow(InvalidCoordinatesError);
    });

    it("lanza InvalidCoordinatesError si la latitud es menor a -90", () => {
      expect(() => new Coordinates(-91, 0)).toThrow(InvalidCoordinatesError);
    });

    it("lanza InvalidCoordinatesError si la longitud supera 180", () => {
      expect(() => new Coordinates(0, 181)).toThrow(InvalidCoordinatesError);
    });

    it("lanza InvalidCoordinatesError si la longitud es menor a -180", () => {
      expect(() => new Coordinates(0, -181)).toThrow(InvalidCoordinatesError);
    });
  });
});
