import { User } from "../entities/User";
import { AccessTokenPayload } from "./ITokenSigner";

export function accessTokenPayloadFor(user: User): AccessTokenPayload {
  return { sub: user.id, email: user.email, isVerified: user.isVerified };
}
