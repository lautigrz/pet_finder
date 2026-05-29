export class LoginUserInput {
  constructor(
    public readonly email: string,
    public readonly plainPassword: string,
  ) {}
}
