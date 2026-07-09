import { describe, it, expect, vi, beforeEach } from "vitest";

const { getToken, verifyIdToken } = vi.hoisted(() => ({
  getToken: vi.fn(),
  verifyIdToken: vi.fn(),
}));

vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    getToken = getToken;
    verifyIdToken = verifyIdToken;
  },
}));

import { GoogleOAuthAuthenticator } from "../GoogleOAuthAuthenticator";
import { InvalidGoogleTokenError } from "@domain/errors/InvalidGoogleTokenError";

const ticketWith = (payload: unknown) => ({ getPayload: () => payload });

describe("GoogleOAuthAuthenticator", () => {
  let authenticator: GoogleOAuthAuthenticator;

  beforeEach(() => {
    getToken.mockReset();
    verifyIdToken.mockReset();
    authenticator = new GoogleOAuthAuthenticator("client-id", "client-secret");
  });

  it("exchanges the code and maps the verified payload to an identity", async () => {
    // Given un code que canjea un id_token con payload completo
    getToken.mockResolvedValue({ tokens: { id_token: "id-token" } });
    verifyIdToken.mockResolvedValue(
      ticketWith({ sub: "google-sub-1", email: "juan@example.com", email_verified: true, name: "Juan", picture: "https://pic" }),
    );

    // When autentico
    const identity = await authenticator.authenticate("auth-code");

    // Then canjea el code y mapea el payload a la identidad de dominio
    expect(getToken).toHaveBeenCalledWith("auth-code");
    expect(identity).toEqual({
      email: "juan@example.com",
      emailVerified: true,
      googleId: "google-sub-1",
      name: "Juan",
      picture: "https://pic",
    });
  });

  it("defaults optional fields to null when Google omits them", async () => {
    // Given un payload minimo sin name ni picture y con el email sin verificar
    getToken.mockResolvedValue({ tokens: { id_token: "id-token" } });
    verifyIdToken.mockResolvedValue(ticketWith({ sub: "google-sub-2", email: "ana@example.com", email_verified: false }));

    // When autentico
    const identity = await authenticator.authenticate("auth-code");

    // Then los opcionales quedan en null y respeta el flag de verificacion
    expect(identity.name).toBeNull();
    expect(identity.picture).toBeNull();
    expect(identity.emailVerified).toBe(false);
  });

  it("throws InvalidGoogleTokenError when the code exchange fails", async () => {
    // Given un code invalido que Google rechaza
    getToken.mockRejectedValue(new Error("bad code"));

    // When / Then tira el error de dominio
    await expect(authenticator.authenticate("bad-code")).rejects.toThrow(InvalidGoogleTokenError);
  });

  it("throws InvalidGoogleTokenError when the payload has no email", async () => {
    // Given un payload sin email
    getToken.mockResolvedValue({ tokens: { id_token: "id-token" } });
    verifyIdToken.mockResolvedValue(ticketWith({ sub: "google-sub-3" }));

    // When / Then tira el error de dominio
    await expect(authenticator.authenticate("auth-code")).rejects.toThrow(InvalidGoogleTokenError);
  });
});
