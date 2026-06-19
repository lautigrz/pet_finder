import { App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { IPushSender, PushNotification } from "@domain/services/IPushSender";
import logger from "../logger";

const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

export class FirebaseAdminPushSender implements IPushSender {
  constructor(private readonly app: App) {}

  async send(tokens: string[], notification: PushNotification): Promise<string[]> {
    if (tokens.length === 0) return [];
    const response = await getMessaging(this.app).sendEachForMulticast({
      tokens,
      data: { title: notification.title, body: notification.body, ...notification.data },
    });
    return this.collectDeadTokens(response.responses, tokens);
  }

  private collectDeadTokens(
    responses: { success: boolean; error?: { code: string } }[],
    tokens: string[],
  ): string[] {
    const dead: string[] = [];
    responses.forEach((result, index) => {
      if (result.success) return;
      logger.warn(`[PUSH] envio fallido: ${result.error?.code ?? "unknown"}`);
      const token = tokens[index];
      if (token && result.error && DEAD_TOKEN_CODES.has(result.error.code)) dead.push(token);
    });
    return dead;
  }
}
