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

    // Then arma el mensaje multicast con esos tokens
    expect(sendEachForMulticast).toHaveBeenCalledWith({
      tokens: ["t1", "t2"],
      notification: { title: "PetFinder", body: "Hola" },
      data: undefined,
    });
  });

  it("does not call FCM when there are no tokens", async () => {
    // Given una lista vacía de tokens
    // When intento enviar
    await sender.send([], { title: "x", body: "y" });

    // Then no se llama a FCM (no hay a quién mandar)
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });
});
