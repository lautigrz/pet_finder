import jwt, { SignOptions } from "jsonwebtoken";
import { AppealTokenPayload, IAppealTokenSigner } from "@domain/services/IAppealTokenSigner";
import { InvalidAppealTokenError } from "@domain/appeal/errors/InvalidAppealTokenError";
import { isValidAppealTargetType } from "@domain/appeal/types/appeal-target-type";
import { injectable } from "tsyringe";

const ALGORITHM = "HS256";

@injectable()
export class JwtAppealTokenSigner implements IAppealTokenSigner {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: SignOptions["expiresIn"],
  ) { }

  sign(payload: AppealTokenPayload): string {
    return jwt.sign(payload, this.secret, { algorithm: ALGORITHM, expiresIn: this.expiresIn });
  }

  verify(token: string): AppealTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: [ALGORITHM] });
      return this.toPayload(decoded);
    } catch {
      throw new InvalidAppealTokenError();
    }
  }

  private toPayload(decoded: unknown): AppealTokenPayload {
    if (typeof decoded !== "object" || decoded === null) throw new InvalidAppealTokenError();
    const { targetType, targetPublicId, appellantPublicId } = decoded as Record<string, unknown>;
    if (
      typeof targetType !== "string" || !isValidAppealTargetType(targetType) ||
      typeof targetPublicId !== "string" || typeof appellantPublicId !== "string"
    ) {
      throw new InvalidAppealTokenError();
    }
    return { targetType, targetPublicId, appellantPublicId };
  }
}
