export const MATCH_CHANNEL = 'match:notification';
export const MATCH_EVENT = 'match:new';
export const MATCH_NOTIFICATION_THRESHOLD = 0.7;

export type MatchRole = 'dueno' | 'avistador';

export type MatchNotification = {
  ownerPublicId: string;
  rol: MatchRole;
  lostReportPublicId: string;
  lostPetName: string | null;
  lostPetImage: string | null;
  matchPublicId: string;
  matchedReportPublicId: string;
  matchedImage: string | null;
  score: number;
  imageScore?: number | null;
  descriptionScore?: number | null;
  seen: boolean;
  createdAt: string;
};
