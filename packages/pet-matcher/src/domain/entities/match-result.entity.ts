export interface MatchResult {
  reportId: number;
  publicId: string;
  score: number;
  imageScore: number;
  descriptionScore: number;
  structuredScore: number;
  sharedFields: number;
}
