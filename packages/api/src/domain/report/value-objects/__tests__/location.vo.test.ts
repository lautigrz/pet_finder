import { describe, it, expect } from "vitest";
import { Location } from "../location.vo";
import { InvalidLocationError } from "../../../errors/InvalidLocationError";
import { InvalidCoordinatesError } from "../../../errors/InvalidCoordinatesError";

describe("Location.create", () => {
  describe("con dirección válida", () => {
    it("crea una Location con dirección y coordenadas válidas", () => {
      // Given dirección y coordenadas válidas
      const location = Location.create({
        address: "Av. Corrientes 1234",
        latitude: -34.603722,
        longitude: -58.381592,
      });

      // Then expone los valores correctamente
      expect(location.address).toBe("Av. Corrientes 1234");
      expect(location.latitude).toBe(-34.603722);
      expect(location.longitude).toBe(-58.381592);
    });

    it("acepta una dirección de exactamente 5 caracteres", () => {
      const location = Location.create({
        address: "A1 Bc",
        latitude: 0,
        longitude: 0,
      });
      expect(location.address).toBe("A1 Bc");
    });
  });

  describe("sin dirección (null)", () => {
    it("crea una Location con address null", () => {
      // Given address null
      const location = Location.create({
        address: null,
        latitude: 10,
        longitude: 20,
      });

      // Then address es null
      expect(location.address).toBeNull();
      expect(location.latitude).toBe(10);
      expect(location.longitude).toBe(20);
    });
  });

  describe("dirección inválida", () => {
    it("lanza InvalidLocationError si la dirección es menor a 5 caracteres", () => {
      // Given dirección de 3 caracteres
      expect(() =>
        Location.create({ address: "Abc", latitude: 0, longitude: 0 })
      ).toThrow(InvalidLocationError);
    });

    it("lanza InvalidLocationError si la dirección supera 200 caracteres", () => {
      const longAddress = "A".repeat(201);
      expect(() =>
        Location.create({ address: longAddress, latitude: 0, longitude: 0 })
      ).toThrow(InvalidLocationError);
    });

    it("lanza InvalidLocationError si la dirección no contiene letras", () => {
      // Given dirección solo numérica
      expect(() =>
        Location.create({ address: "12345", latitude: 0, longitude: 0 })
      ).toThrow(InvalidLocationError);
    });
  });

  describe("coordenadas inválidas", () => {
    it("lanza InvalidCoordinatesError si la latitud es inválida", () => {
      expect(() =>
        Location.create({ address: null, latitude: 200, longitude: 0 })
      ).toThrow(InvalidCoordinatesError);
    });

    it("lanza InvalidCoordinatesError si la longitud es inválida", () => {
      expect(() =>
        Location.create({ address: null, latitude: 0, longitude: 500 })
      ).toThrow(InvalidCoordinatesError);
    });
  });
});
