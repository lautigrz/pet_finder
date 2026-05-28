import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { UpdateProfileInput } from "./update-profile.input";
import { UpdateProfileOutput } from "./update-profile.output";
import { UserNotFoundError } from "../../../domain/errors/UserNotFoundError";

export class UpdateProfileUseCase{
    constructor(
        private readonly userRepository: IUserRepository
    ){} 
    
    async execute(input:UpdateProfileInput): Promise<UpdateProfileOutput>{
        const existingUser = await this.userRepository.findByPublicId(input.publicId);

        if(!existingUser) {
            throw new UserNotFoundError();
        }

        const updatedUser = await this.userRepository.updateProfile(
            input.publicId, 
            {
                name: input.name,
                lastname: input.lastname,
                username: input.username,
                photoUrl: input.photoUrl
            },
        );

        return new UpdateProfileOutput(updatedUser.id, updatedUser.email, updatedUser.username, updatedUser.name, updatedUser.lastname, updatedUser.photoUrl);
    }
}