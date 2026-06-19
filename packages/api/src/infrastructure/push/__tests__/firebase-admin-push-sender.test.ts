import { beforeEach, describe, expect, it, vi } from "vitest";
import type { App } from "firebase-admin/app";

// firebase-admin es un tercero -> lo mockeamos (testeamos NUESTRA reacción, no el SDK).
const { sendEachForMulticast } = vi.hoisted(() => ({ sendEachForMulticast: vi.fn() }));
vi.mock("firebase-admin/messaging", () => ({
  getMessaging: () => ({ sendEachForMulticast }),
}));

import { FirebaseAdminPushSender } from "../FirebaseAdminPushSender";

describe("FirebaseAdminPushSender", () => {
  let sender: FirebaseAdminPushSender;

  beforeEach(() => {
    sendEachForMulticast.mockReset();
    sender = new FirebaseAdminPushSender({} as App);
  });

  it("sends a multicast message to the given tokens", async () => {
    // Given FCM responde sin fallos
    sendEachForMulticast.mockResolvedValue({ failureCount: 0, successCount: 2, responses: [] });

    // When envío a dos tokens
    await sender.send(["t1", "t2"], { title: "PetFinder", body: "Hola" });

    // Then arma el mensaje multicast data-only con esos tokens
    expect(sendEachForMulticast).toHaveBeenCalledWith({
      tokens: ["t1", "t2"],
      data: { title: "PetFinder", body: "Hola" },
    });
  });

  it("returns the tokens that FCM reports as not registered", async () => {
    // Given FCM rechaza el segundo token como no registrado (muerto)
    sendEachForMulticast.mockResolvedValue({
      failureCount: 1,
      successCount: 1,
      responses: [
        { success: true },
        { success: false, error: { code: "messaging/registration-token-not-registered" } },
      ],
    });

    // When envío a dos tokens
    const dead = await sender.send(["t1", "t2"], { title: "x", body: "y" });

    // Then devuelve el muerto para que el caller lo borre
    expect(dead).toEqual(["t2"]);
  });

  it("does not call FCM when there are no tokens", async () => {
    // Given una lista vacía de tokens
    // When intento enviar
    await sender.send([], { title: "x", body: "y" });

    // Then no se llama a FCM (no hay a quién mandar)
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });
});
