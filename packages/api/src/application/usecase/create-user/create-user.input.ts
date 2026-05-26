export class CreateUserInput {
  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly plainPassword: string,
  ) {}
}
