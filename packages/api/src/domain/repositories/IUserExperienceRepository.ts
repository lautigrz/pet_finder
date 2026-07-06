import { User } from "../entities/User";

export interface IUserExperienceRepository {
  addExp(publicId: string, amount: number): Promise<User>;
}
