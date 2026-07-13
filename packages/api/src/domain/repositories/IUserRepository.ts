import { User } from "../entities/User";

export interface UserProfileStats {
  reportsCreated: number;
  successfulReturns: number;
  activeDays: number;
  petsHelped: number;
}

export interface UserNotificationTarget {
  publicId: string;
  role: string;
  lastKnownLatitude: number | null;
  lastKnownLongitude: number | null;
  lastKnownLocationAt: Date | null;
  notificationRadius: number;
  lostReportsEnabled: boolean;
  mutedUntil: Date | null;
}

export interface IUserRepository {
  save(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  markVerified(internalUserId: number): Promise<void>;
  markSuspended(internalUserId: number): Promise<void>;
  unsuspend(internalUserId: number): Promise<void>;
  findByPublicId(publicId: string): Promise<User | null>;
  findRoleByPublicId(publicId: string): Promise<string | null>;
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
  getProfileStatsByPublicId(publicId:string): Promise<UserProfileStats>;
  findNotificationCandidates(): Promise<UserNotificationTarget[]>;
  updateCurrentLocation(publicId: string, latitude: number, longitude: number, updatedAt: Date): Promise<void>;
}
