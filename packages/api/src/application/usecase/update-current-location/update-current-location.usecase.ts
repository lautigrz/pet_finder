import { inject, injectable } from "tsyringe";
import type { IUserRepository } from "@domain/repositories/IUserRepository";
import { UpdateCurrentLocationInput } from "./update-current-location.input";

@injectable()
export class UpdateCurrentLocationUseCase {
  constructor(
    @inject("UserRepository")
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: UpdateCurrentLocationInput): Promise<void> {
  await this.userRepository.updateCurrentLocation(
    input.publicId,
    input.latitude,
    input.longitude,
    new Date(),
  );
}
}