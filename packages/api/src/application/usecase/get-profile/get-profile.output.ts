export class GetProfileOutput {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly username: string,
    public readonly name?: string,
    public readonly lastname?: string,
    public readonly photoUrl?: string,
    public readonly role?: string,
  ) {}
}