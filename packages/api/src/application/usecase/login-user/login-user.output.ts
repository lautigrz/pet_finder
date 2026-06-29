export class LoginUserOutput {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
  ) {}
}
