import { LostNearbySocketNotification } from "@pet-alert/shared";

export interface ILostNearbyNotifier {
  publish(notification: LostNearbySocketNotification): Promise<void>;
}