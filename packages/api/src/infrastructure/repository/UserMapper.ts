import { User as UserPrisma } from "@prisma/client";
import { User } from "../../domain/entities/User";

export class UserMapper {
  static toDomain(record: UserPrisma): User {
    return User.reconstruct(
      record.user_id,
      record.public_id,
      record.email,
      record.username,
      record.password,
      record.is_verified,
      record.created_at,
      record.name,
      record.lastname,
      record.photo_url,
      record.is_suspended,
    );
  }

  static toPersistence(user: User) {
    return {
      public_id: user.id,
      email: user.email,
      username: user.username,
      password: user.passwordHash,
      is_verified: user.isVerified,
      is_suspended: user.isSuspended,
      name: user.name,
      lastname: user.lastname,
      photo_url: user.photoUrl,
    };
  }
}
