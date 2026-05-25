import { randomBytes } from "node:crypto";
import { ITokenGenerator } from "../../domain/services/ITokenGenerator";

const TOKEN_BYTE_LENGTH = 32;

export class CryptoTokenGenerator implements ITokenGenerator {
  generate(): string {
    return randomBytes(TOKEN_BYTE_LENGTH).toString("hex");
  }
}
