import { describe, it, expect } from "vitest";
import { EmailAddress } from "../email-address.vo";
import { InvalidEmailError } from "@domain/errors/InvalidEmailError";

describe("EmailAddress", () => {
  describe("valores válidos", () => {
    it("crea un email válido", () => {
      const email = EmailAddress.create("juan@example.com");
      expect(email.value).toBe("juan@example.com");
    });

    it("normaliza a minúsculas y recorta espacios", () => {
      const email = EmailAddress.create("  JUAN@Example.COM  ");
      expect(email.value).toBe("juan@example.com");
    });
  });

  describe("valores inválidos", () => {
    it("lanza InvalidEmailError si falta el @", () => {
      expect(() => EmailAddress.create("juanexample.com")).toThrow(InvalidEmailError);
    });

    it("lanza InvalidEmailError si falta el dominio", () => {
      expect(() => EmailAddress.create("juan@")).toThrow(InvalidEmailError);
    });

    it("lanza InvalidEmailError si está vacío", () => {
      expect(() => EmailAddress.create("   ")).toThrow(InvalidEmailError);
    });
  });
});
