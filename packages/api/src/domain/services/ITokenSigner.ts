export interface AccessTokenPayload {
  sub: string;
  email: string;
  isVerified: boolean;
}

export interface ITokenSigner {
  sign(payload: AccessTokenPayload): string;
  verify(token: string): AccessTokenPayload;
}
