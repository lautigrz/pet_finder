export interface IPasswordHasher {
  hash(plainPassword: string): Promise<string>;
  verify(plainPassword: string, hash: string): Promise<boolean>;
}
