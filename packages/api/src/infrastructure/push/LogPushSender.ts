import { IPushSender, PushNotification } from "@domain/services/IPushSender";
import logger from "../logger";

export class LogPushSender implements IPushSender {
  async send(tokens: string[], notification: PushNotification): Promise<void> {
    logger.info(
      `[PUSH MOCK] "${notification.title}: ${notification.body}" -> ${tokens.length} token(s)`,
    );
  }
}
