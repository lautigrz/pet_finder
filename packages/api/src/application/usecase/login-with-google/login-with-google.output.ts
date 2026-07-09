export class LoginWithGoogleOutput {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
  ) {}
}
