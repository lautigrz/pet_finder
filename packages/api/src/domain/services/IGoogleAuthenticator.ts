export interface GoogleIdentity {
  email: string;
  emailVerified: boolean;
  googleId: string;
  name: string | null;
  picture: string | null;
}

export interface IGoogleAuthenticator {
  authenticate(authCode: string): Promise<GoogleIdentity>;
}
