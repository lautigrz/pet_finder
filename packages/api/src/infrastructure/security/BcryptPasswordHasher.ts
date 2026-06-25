import bcrypt from "bcrypt";
import { IPasswordHasher } from "../../domain/services/IPasswordHasher";
import { injectable } from "tsyringe";

const SALT_ROUNDS = 12;

@injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  async verify(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}
