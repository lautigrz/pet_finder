import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { JwtAppealTokenSigner } from "../JwtAppealTokenSigner";
import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";
import { InvalidAppealTokenError } from "@domain/appeal/errors/InvalidAppealTokenError";

const SECRET = "test-secret";
const payload = { targetType: AppealTargetType.POST, targetPublicId: "post-uuid", appellantPublicId: "owner-uuid" };

describe("JwtAppealTokenSigner", () => {
  const signer = new JwtAppealTokenSigner(SECRET, "30d");

  it("firma y verifica el ida y vuelta del caso apelado", () => {
    const token = signer.sign(payload);

    expect(signer.verify(token)).toEqual(payload);
  });

  it("lanza InvalidAppealTokenError con un token corrupto", () => {
    expect(() => signer.verify("no-es-un-jwt")).toThrow(InvalidAppealTokenError);
  });

  it("lanza InvalidAppealTokenError si el token fue firmado con otro secreto", () => {
    const foreign = jwt.sign(payload, "otro-secreto", { algorithm: "HS256" });

    expect(() => signer.verify(foreign)).toThrow(InvalidAppealTokenError);
  });

  it("lanza InvalidAppealTokenError si el targetType no es válido", () => {
    const bad = jwt.sign({ targetType: "CHAT", targetPublicId: "x", appellantPublicId: "y" }, SECRET, { algorithm: "HS256" });

    expect(() => signer.verify(bad)).toThrow(InvalidAppealTokenError);
  });
});
