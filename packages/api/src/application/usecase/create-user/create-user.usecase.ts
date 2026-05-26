import { User } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../../../domain/services/IPasswordHasher";
import { EmailAlreadyExistsError } from "../../../domain/errors/EmailAlreadyExistsError";
import { CreateUserInput } from "./create-user.input";
import { CreateUserOutput } from "./create-user.output";

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const normalizedEmail = this.normalizeEmail(input.email);
    await this.assertEmailIsAvailable(normalizedEmail);
    const passwordHash = await this.passwordHasher.hash(input.plainPassword);
    const newUser = User.create(normalizedEmail, passwordHash);
    const persisted = await this.userRepository.save(newUser);
    return new CreateUserOutput(persisted.id, persisted.internalId!, persisted.email);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async assertEmailIsAvailable(email: string): Promise<void> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new EmailAlreadyExistsError(email);
  }
}
