import { randomBytes } from "node:crypto";
import { ITokenGenerator } from "../../domain/services/ITokenGenerator";
import { injectable } from "tsyringe";

const TOKEN_BYTE_LENGTH = 32;

@injectable()
export class CryptoTokenGenerator implements ITokenGenerator {
  generate(): string {
    return randomBytes(TOKEN_BYTE_LENGTH).toString("hex");
  }
}
