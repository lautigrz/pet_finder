import { cert, initializeApp } from "firebase-admin/app";
import { IPushSender } from "@domain/services/IPushSender";
import { LogPushSender } from "./LogPushSender";
import { FirebaseAdminPushSender } from "./FirebaseAdminPushSender";
import { readPushConfig } from "./push.config";

export function createPushSender(): IPushSender {
  const config = readPushConfig();
  if (config.provider === "log") {
    return new LogPushSender();
  }
  const serviceAccount = JSON.parse(
    Buffer.from(config.serviceAccountBase64!, "base64").toString("utf8"),
  );
  const app = initializeApp({ credential: cert(serviceAccount) }, "push");
  return new FirebaseAdminPushSender(app);
}
