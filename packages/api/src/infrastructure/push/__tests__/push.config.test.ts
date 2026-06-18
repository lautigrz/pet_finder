import { describe, expect, it } from "vitest";
import { readPushConfig } from "../push.config";

describe("readPushConfig", () => {
  it("defaults to the log provider when nothing is set", () => {
    // Given un entorno sin variables de push
    const config = readPushConfig({} as NodeJS.ProcessEnv);

    // Then usa el sender de log (no necesita credenciales)
    expect(config.provider).toBe("log");
  });

  it("reads the fcm provider with its service account", () => {
    // Given el proveedor fcm con la credencial en base64
    const config = readPushConfig({
      PUSH_PROVIDER: "fcm",
      FIREBASE_SERVICE_ACCOUNT_BASE64: "eyJhIjoxfQ==",
    } as NodeJS.ProcessEnv);

    // Then expone la credencial
    expect(config.provider).toBe("fcm");
    expect(config.serviceAccountBase64).toBe("eyJhIjoxfQ==");
  });

  it("rejects fcm without a service account", () => {
    // Given fcm pero sin credencial
    const action = () => readPushConfig({ PUSH_PROVIDER: "fcm" } as NodeJS.ProcessEnv);

    // Then falla (no se puede enviar sin credencial)
    expect(action).toThrow();
  });
});
