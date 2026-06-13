import { User } from "../../../domain/entities/User";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../../../domain/services/IPasswordHasher";
import { EmailAddress } from "../../../domain/shared/email/email-address.vo";
import { EmailAlreadyExistsError } from "../../../domain/errors/EmailAlreadyExistsError";
import { CreateUserInput } from "./create-user.input";
import { CreateUserOutput } from "./create-user.output";

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const email = EmailAddress.create(input.email);
    await this.assertEmailIsAvailable(email);
    const persisted = await this.saveUser(email, input.username.trim(), input.plainPassword);
    return new CreateUserOutput(persisted.id, persisted.requireInternalId(), persisted.email);
  }

  private async assertEmailIsAvailable(email: EmailAddress): Promise<void> {
    const existing = await this.userRepository.findByEmail(email.value);
    if (existing) throw new EmailAlreadyExistsError(email.value);
  }

  private async saveUser(email: EmailAddress, username: string, plainPassword: string): Promise<User> {
    const passwordHash = await this.passwordHasher.hash(plainPassword);
    return this.userRepository.save(User.create(email, username, passwordHash));
  }
}
