import { User as UserPrisma } from "@prisma/client";
import { User } from "../../domain/entities/User";

export class UserMapper {
  static toDomain(record: UserPrisma): User {
    return User.reconstruct(
      record.user_id,
      record.public_id,
      record.email,
      record.password,
      record.is_verified,
      record.created_at,
    );
  }

  static toPersistence(user: User) {
    return {
      public_id: user.id,
      email: user.email,
      password: user.passwordHash,
      is_verified: user.isVerified,
    };
  }
}
