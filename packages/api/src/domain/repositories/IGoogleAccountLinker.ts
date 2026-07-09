export interface IGoogleAccountLinker {
  linkGoogleId(internalUserId: number, googleId: string): Promise<void>;
}
