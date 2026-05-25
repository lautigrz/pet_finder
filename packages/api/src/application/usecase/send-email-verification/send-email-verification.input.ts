export class SendEmailVerificationInput {
  constructor(
    public readonly internalUserId: number,
    public readonly email: string,
  ) {}
}
