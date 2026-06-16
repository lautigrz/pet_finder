import { describe, it, expect } from "vitest";
import { MessageText } from "../message.vo";

describe("MessageText", () => {
  describe("crear", () => {
    it("crea un MessageText válido con texto normal", () => {
      const text = MessageText.create("Hola, ¿viste a mi perro?");
      expect(text.getValue()).toBe("Hola, ¿viste a mi perro?");
    });

    it("toString retorna el valor del texto", () => {
      const text = MessageText.create("Hello");
      expect(text.toString()).toBe("Hello");
    });
  });

  describe("validación de texto vacío", () => {
    it("lanza error si el texto es un string vacío", () => {
      expect(() => MessageText.create("")).toThrow("Message text cannot be empty");
    });

    it("lanza error si el texto es solo espacios en blanco", () => {
      expect(() => MessageText.create("   ")).toThrow("Message text cannot be empty");
    });
  });

  describe("validación de largo máximo", () => {
    it("lanza error si el texto supera los 1000 caracteres", () => {
      const longText = "a".repeat(1001);
      expect(() => MessageText.create(longText)).toThrow("Message text cannot exceed 1000 characters");
    });

    it("acepta texto con exactamente 1000 caracteres", () => {
      const maxText = "a".repeat(1000);
      const text = MessageText.create(maxText);
      expect(text.getValue()).toBe(maxText);
    });
  });

  describe("detección de números de teléfono", () => {
    it("lanza error si el texto contiene un número de teléfono con código de país", () => {
      expect(() => MessageText.create("Llamame al +54 11 1234 5678")).toThrow(
        "Message text cannot contain phone numbers"
      );
    });

    it("lanza error si el texto contiene un número de teléfono con guiones", () => {
      expect(() => MessageText.create("Mi número es 011-1234-5678")).toThrow(
        "Message text cannot contain phone numbers"
      );
    });

    it("lanza error si el texto contiene un número de teléfono con paréntesis", () => {
      expect(() => MessageText.create("Contactame (011) 12345678")).toThrow(
        "Message text cannot contain phone numbers"
      );
    });

    it("permite secuencias cortas de dígitos que no son números de teléfono", () => {
      const text = MessageText.create("Tengo 3 gatos y 2 perros");
      expect(text.getValue()).toBe("Tengo 3 gatos y 2 perros");
    });
  });

  describe("detección de emails", () => {
    it("lanza error si el texto contiene una dirección de email", () => {
      expect(() => MessageText.create("Escribime a juan@gmail.com")).toThrow(
        "Message text cannot contain email addresses"
      );
    });

    it("lanza error si el texto contiene un email dentro de una oración", () => {
      expect(() => MessageText.create("Mi mail es test.user@example.co.ar por cualquier cosa")).toThrow(
        "Message text cannot contain email addresses"
      );
    });

    it("permite texto con @ que no es un email", () => {
      const text = MessageText.create("Seguime en @juancho en instagram");
      expect(text.getValue()).toBe("Seguime en @juancho en instagram");
    });
  });
});
