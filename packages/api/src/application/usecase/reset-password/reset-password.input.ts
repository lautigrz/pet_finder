export class ResetPasswordInput {
  constructor(
    public readonly token: string,
    public readonly newPassword: string,
  ) {}
}
