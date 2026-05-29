export class CreateUserInput {
  constructor(
    public readonly email: string,
    public readonly plainPassword: string,
  ) {}
}
