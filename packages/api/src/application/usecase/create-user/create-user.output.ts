export class CreateUserOutput {
  constructor(
    public readonly userId: string,
    public readonly internalUserId: number,
    public readonly email: string,
  ) {}
}
