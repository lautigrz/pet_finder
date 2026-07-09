import { OAuth2Client, TokenPayload } from "google-auth-library";
import { logger } from "@pet-alert/shared";
import { IGoogleAuthenticator, GoogleIdentity } from "@domain/services/IGoogleAuthenticator";
import { InvalidGoogleTokenError } from "@domain/errors/InvalidGoogleTokenError";

const POSTMESSAGE_REDIRECT = "postmessage";

export class GoogleOAuthAuthenticator implements IGoogleAuthenticator {
  private readonly client: OAuth2Client;

  constructor(private readonly clientId: string, clientSecret: string) {
    this.client = new OAuth2Client(clientId, clientSecret, POSTMESSAGE_REDIRECT);
  }

  async authenticate(authCode: string): Promise<GoogleIdentity> {
    const payload = await this.exchangeCode(authCode);
    return this.toIdentity(payload);
  }

  private async exchangeCode(authCode: string): Promise<TokenPayload> {
    try {
      const { tokens } = await this.client.getToken(authCode);
      const ticket = await this.client.verifyIdToken({ idToken: tokens.id_token ?? "", audience: this.clientId });
      const payload = ticket.getPayload();
      if (payload) return payload;
      throw new Error("empty id token payload");
    } catch (error) {
      logger.warn("Google code exchange failed", { reason: (error as Error).message });
      throw new InvalidGoogleTokenError();
    }
  }

  private toIdentity(payload: TokenPayload): GoogleIdentity {
    if (!payload.email) throw new InvalidGoogleTokenError();
    return {
      email: payload.email,
      emailVerified: payload.email_verified ?? false,
      googleId: payload.sub,
      name: payload.name ?? null,
      picture: payload.picture ?? null,
    };
  }
}
