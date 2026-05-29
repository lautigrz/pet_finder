import jwt, { SignOptions } from "jsonwebtoken";
import { AccessTokenPayload, ITokenSigner } from "../../domain/services/ITokenSigner";
import { InvalidAccessTokenError } from "../../domain/errors/InvalidAccessTokenError";

const ALGORITHM = "HS256";

export class JwtTokenSigner implements ITokenSigner {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: SignOptions["expiresIn"],
  ) {}

  sign(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.secret, { algorithm: ALGORITHM, expiresIn: this.expiresIn });
  }

  verify(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: [ALGORITHM] });
      return this.toPayload(decoded);
    } catch {
      throw new InvalidAccessTokenError();
    }
  }

  private toPayload(decoded: unknown): AccessTokenPayload {
    if (typeof decoded !== "object" || decoded === null) throw new InvalidAccessTokenError();
    const { sub, email, isVerified } = decoded as Record<string, unknown>;
    if (typeof sub !== "string" || typeof email !== "string" || typeof isVerified !== "boolean") {
      throw new InvalidAccessTokenError();
    }
    return { sub, email, isVerified };
  }
}
