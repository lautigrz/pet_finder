import type { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { UserNotFoundError } from "../../../domain/errors/UserNotFoundError";
import { GetProfileOutput } from "./get-profile.output";
import { injectable, inject } from "tsyringe";

@injectable()
export class GetProfileUseCase {
    constructor(
        @inject("UserRepository")
        private readonly userRepository: IUserRepository) {
    }

    async execute(publicId: string): Promise<GetProfileOutput> {
        const user = await this.userRepository.findByPublicId(publicId);

        if (!user) {
            throw new UserNotFoundError();
        }

        const role = await this.userRepository.findRoleByPublicId(publicId);
        return new GetProfileOutput(user.id, user.email, user.username, user.name ?? undefined, user.lastname ?? undefined, user.photoUrl ?? undefined, role ?? undefined);
    }
}