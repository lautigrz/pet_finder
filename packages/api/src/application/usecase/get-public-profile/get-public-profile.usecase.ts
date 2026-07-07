import type { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { UserNotFoundError } from "../../../domain/errors/UserNotFoundError";
import { GetPublicProfileOutput } from "./get-public-profile.output";
import { injectable, inject } from "tsyringe";

@injectable()
export class GetPublicProfileUseCase {
    constructor(
        @inject("UserRepository")
        private readonly userRepository: IUserRepository) {
    }

    async execute(publicId: string): Promise<GetPublicProfileOutput> {
        const user = await this.userRepository.findByPublicId(publicId);


        if (!user || user.isSuspended) {
            throw new UserNotFoundError();
        }
        const stats = await this.userRepository.getProfileStatsByPublicId(publicId);


        return new GetPublicProfileOutput(
            user.id,
            user.username,
            user.name ?? undefined,
            user.lastname ?? undefined,
            user.photoUrl ?? undefined,
            stats,
        );
    }
}
