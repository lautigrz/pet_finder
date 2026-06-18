import { App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { IPushSender, PushNotification } from "@domain/services/IPushSender";
import logger from "../logger";

export class FirebaseAdminPushSender implements IPushSender {
  constructor(private readonly app: App) {}

  async send(tokens: string[], notification: PushNotification): Promise<void> {
    if (tokens.length === 0) return;
    const response = await getMessaging(this.app).sendEachForMulticast({
      tokens,
      notification: { title: notification.title, body: notification.body },
      data: notification.data,
    });
    if (response.failureCount > 0) {
      logger.warn(`[PUSH] ${response.failureCount}/${tokens.length} envios fallaron`);
    }
  }
}
