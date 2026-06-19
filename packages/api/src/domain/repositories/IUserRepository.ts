import { User } from "../entities/User";

export interface IUserRepository {
  save(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  markVerified(internalUserId: number): Promise<void>;
  findByPublicId(publicId: string): Promise<User | null>;
  findByIds(userInternalIds: number[]): Promise<{ user_id: number, public_id: string, username: string, photoUrl: string | null }[]>;
  findById(internalUserId: number): Promise<User | null>;
  updateProfile(publicId: string,
    data: {
      name?: string;
      lastname?: string;
      username?: string;
      photoUrl?: string;
    },): Promise<User>;
  updatePassword(internalUserId: number, passwordHash: string): Promise<void>;
  deleteById(internalUserId: number): Promise<void>;
}
