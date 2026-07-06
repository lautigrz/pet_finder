import type { UserProfileStats } from "../../../domain/repositories/IUserRepository";

export class GetPublicProfileOutput {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly name?: string,
    public readonly lastname?: string,
    public readonly photoUrl?: string,
    public readonly stats?: UserProfileStats,
  ) {}
}
