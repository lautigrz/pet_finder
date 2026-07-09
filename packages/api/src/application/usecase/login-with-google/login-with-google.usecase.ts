import { RefreshToken } from "../../../domain/entities/RefreshToken";
import { User } from "../../../domain/entities/User";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository";
import type { IGoogleAccountLinker } from "../../../domain/repositories/IGoogleAccountLinker";
import type { IRefreshTokenRepository } from "../../../domain/repositories/IRefreshTokenRepository";
import type { IGoogleAuthenticator, GoogleIdentity } from "../../../domain/services/IGoogleAuthenticator";
import type { ITokenSigner } from "../../../domain/services/ITokenSigner";
import type { ITokenGenerator } from "../../../domain/services/ITokenGenerator";
import { accessTokenPayloadFor } from "../../../domain/auth/access-token-payload";
import { EmailAddress } from "../../../domain/shared/email/email-address.vo";
import { usernameFromEmail } from "../../../domain/shared/username/username-from-email";
import { GoogleEmailNotVerifiedError } from "../../../domain/errors/GoogleEmailNotVerifiedError";
import { UserSuspendedError } from "../../../domain/errors/UserSuspendedError";
import { LoginWithGoogleInput } from "./login-with-google.input";
import { LoginWithGoogleOutput } from "./login-with-google.output";
import { injectable, inject } from "tsyringe";

@injectable()
export class LoginWithGoogleUseCase {
  constructor(
    @inject("GoogleAuthenticator")
    private readonly googleAuthenticator: IGoogleAuthenticator,
    @inject("UserRepository")
    private readonly userRepository: IUserRepository,
    @inject("GoogleAccountLinker")
    private readonly googleAccountLinker: IGoogleAccountLinker,
    @inject("RefreshTokenRepository")
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @inject("TokenSigner")
    private readonly tokenSigner: ITokenSigner,
    @inject("TokenGenerator")
    private readonly tokenGenerator: ITokenGenerator,
    @inject("RefreshTtlMs")
    private readonly refreshTtlMs: number,
  ) { }

  async execute(input: LoginWithGoogleInput): Promise<LoginWithGoogleOutput> {
    const identity = await this.authenticateWithGoogle(input.authCode);
    const user = await this.findOrCreateUser(identity);
    return this.issueSession(user);
  }

  private async authenticateWithGoogle(authCode: string): Promise<GoogleIdentity> {
    const identity = await this.googleAuthenticator.authenticate(authCode);
    if (!identity.emailVerified) throw new GoogleEmailNotVerifiedError();
    return identity;
  }

  private async findOrCreateUser(identity: GoogleIdentity): Promise<User> {
    const email = EmailAddress.create(identity.email);
    const existing = await this.userRepository.findByEmail(email.value);
    return existing ? this.linkExistingUser(existing, identity) : this.createGoogleUser(email, identity);
  }

  private async linkExistingUser(user: User, identity: GoogleIdentity): Promise<User> {
    if (user.isSuspended) throw new UserSuspendedError();
    if (!user.googleId) await this.googleAccountLinker.linkGoogleId(user.requireInternalId(), identity.googleId);
    return user;
  }

  private async createGoogleUser(email: EmailAddress, identity: GoogleIdentity): Promise<User> {
    const username = usernameFromEmail(email.value);
    return this.userRepository.save(User.createFromGoogle(email, username, identity.googleId, identity.picture));
  }

  private async issueSession(user: User): Promise<LoginWithGoogleOutput> {
    const accessToken = this.tokenSigner.sign(accessTokenPayloadFor(user));
    return new LoginWithGoogleOutput(accessToken, await this.issueRefreshToken(user.requireInternalId()));
  }

  private async issueRefreshToken(internalUserId: number): Promise<string> {
    const value = this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);
    await this.refreshTokenRepository.save(RefreshToken.create(internalUserId, value, expiresAt));
    return value;
  }
}
