export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface IPushSender {
  send(tokens: string[], notification: PushNotification): Promise<void>;
}
