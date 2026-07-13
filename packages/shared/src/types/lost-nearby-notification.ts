export const LOST_NEARBY_CHANNEL = "lost-nearby:notification";
export const LOST_NEARBY_EVENT = "lost-nearby:new";

export type LostNearbySocketNotification = {
  userPublicId: string;

  notificationPublicId: string;

  reportPublicId: string;

  petName: string | null;

  reportImage: string | null;

  reportAddress: string | null;

  title: string;

  body: string;

  seen: boolean;

  createdAt: string;
};