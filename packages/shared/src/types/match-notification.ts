export const MATCH_CHANNEL = 'match:notification';
export const MATCH_EVENT = 'match:new';
export const MATCH_NOTIFICATION_THRESHOLD = 0.1;

export type MatchNotification = {
  ownerPublicId: string;
  lostReportPublicId: string;
  lostPetName: string | null;
  matchPublicId: string;
  matchedReportPublicId: string;
  matchedImage: string | null;
  score: number;
  createdAt: string;
};
