export class RegisterUserInput {
  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly plainPassword: string,
  ) {}
}
