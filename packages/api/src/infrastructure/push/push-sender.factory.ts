import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { IPushSender } from "@domain/services/IPushSender";
import { LogPushSender } from "./LogPushSender";
import { FirebaseAdminPushSender } from "./FirebaseAdminPushSender";
import { readPushConfig } from "./push.config";

const PUSH_APP_NAME = "push";

export function createPushSender(): IPushSender {
  const config = readPushConfig();
  if (config.provider === "log") {
    return new LogPushSender();
  }
  return new FirebaseAdminPushSender(getOrCreatePushApp(config.serviceAccountBase64!));
}

function getOrCreatePushApp(serviceAccountBase64: string): App {
  const existing = getApps().find((app) => app.name === PUSH_APP_NAME);
  if (existing) return existing;

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, "base64").toString("utf8"),
  );
  return initializeApp({ credential: cert(serviceAccount) }, PUSH_APP_NAME);
}
