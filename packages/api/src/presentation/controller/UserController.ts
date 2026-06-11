import { Request, Response } from "express";
import { CreateUserUseCase } from "../../application/usecase/create-user/create-user.usecase";
import { CreateUserInput } from "../../application/usecase/create-user/create-user.input";
import { SendEmailVerificationUseCase } from "../../application/usecase/send-email-verification/send-email-verification.usecase";
import { SendEmailVerificationInput } from "../../application/usecase/send-email-verification/send-email-verification.input";
import { VerifyEmailUseCase } from "../../application/usecase/verify-email/verify-email.usecase";
import { VerifyEmailInput } from "../../application/usecase/verify-email/verify-email.input";
import { EmailAlreadyExistsError } from "../../domain/errors/EmailAlreadyExistsError";
import { InvalidEmailError } from "../../domain/errors/InvalidEmailError";
import { InvalidUsernameError } from "../../domain/errors/InvalidUsernameError";
import { InvalidVerificationTokenError } from "../../domain/errors/InvalidVerificationTokenError";
import { CreateUserRequest } from "../dto/CreateUserRequest";
import { VerifyEmailRequest } from "../dto/VerifyEmailRequest";
import { ValidationError } from "../errors/ValidationError";
import { UpdateProfileUseCase } from "../../application/usecase/update-profile/update-profile.usecase";
import { UpdateProfileInput } from "../../application/usecase/update-profile/update-profile.input";
import { UpdateProfileRequest } from "../dto/UpdateProfileRequest";
import { UserNotFoundError } from "../../domain/errors/UserNotFoundError";
import { GetProfileUseCase } from "../../application/usecase/get-profile/get-profile.usecase";
import { UpdateNotificationPreferencesUseCase } from "../../application/usecase/update-notification-preferences/update-notification-preferences.usecase";
import { UpdateNotificationPreferencesInput } from "../../application/usecase/update-notification-preferences/update-notification-preferences.input";
import { UpdateNotificationPreferencesRequest } from "../dto/UpdateNotificationPreferencesRequest";
import { InvalidNotificationRadiusError } from "../../domain/errors/InvalidNotificationRadiusError";
import { ClaudinaryService } from "../../infrastructure/storage/CloudinaryService";


const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 255;
const USERNAME_MAX_LENGTH = 30;

export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly sendEmailVerificationUseCase: SendEmailVerificationUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly cloudinaryService: ClaudinaryService,
    private readonly updateNotificationsPreferenceUseCase: UpdateNotificationPreferencesUseCase,
  ) { }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = this.validateCreateBody(req.body);
      const created = await this.createUserUseCase.execute(this.toCreateInput(body));
      await this.sendEmailVerificationUseCase.execute(
        new SendEmailVerificationInput(created.internalUserId, created.email),
      );
      res.status(201).json({ id: created.userId });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = this.validateVerifyBody(req.body);
      await this.verifyEmailUseCase.execute(new VerifyEmailInput(body.token));
      res.status(200).json({ verified: true });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = this.validateUpdateProfileBody(req.body);

      const updated = await this.updateProfileUseCase.execute(
        new UpdateProfileInput(
          req.auth!.sub,
          body.name,
          body.lastname,
          body.username,
          body.photoUrl,
        ),
      );
      res.status(200).json(updated);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const profile = await this.getProfileUseCase.execute(req.auth!.sub);

      res.status(200).json(profile);
    } catch (error) {
      this.handleError(error, res);
    }

  };

  uploadProfilePhoto = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "photo is required" });
        return;
      }

      const uploadedImage = await this.cloudinaryService.upload(req.file.buffer, "profiles");

      const updated = await this.updateProfileUseCase.execute(
        new UpdateProfileInput(
          req.auth!.sub,
          undefined,
          undefined,
          undefined,
          uploadedImage.url
        ),
      );

      res.status(200).json(updated);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  updateNotificationPreferences = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const body = this.validateNotificationPreferencesBody(req.body);

      const updated = await this.updateNotificationsPreferenceUseCase.execute(
        new UpdateNotificationPreferencesInput(
          req.auth!.sub,
          body.notificationRadius,
        ),
      );
      res.status(200).json(updated);
    } catch(error) {
      this.handleError(error, res);
    }
  }

  private validateCreateBody(body: unknown): CreateUserRequest {
    const issues: string[] = [];
    const data = (body ?? {}) as Partial<CreateUserRequest>;
    if (typeof data.email !== "string" || data.email.trim().length === 0) {
      issues.push("email is required");
    } else if (data.email.length > EMAIL_MAX_LENGTH) {
      issues.push(`email must be at most ${EMAIL_MAX_LENGTH} characters`);
    }
    if (typeof data.username !== "string" || data.username.trim().length === 0) {
      issues.push("username is required");
    } else if (data.username.length > USERNAME_MAX_LENGTH) {
      issues.push(`username must be at most ${USERNAME_MAX_LENGTH} characters`);
    }
    if (typeof data.password !== "string") {
      issues.push("password is required");
    } else if (data.password.length < PASSWORD_MIN_LENGTH) {
      issues.push(`password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    } else if (data.password.length > PASSWORD_MAX_LENGTH) {
      issues.push(`password must be at most ${PASSWORD_MAX_LENGTH} characters`);
    }
    if (issues.length > 0) throw new ValidationError(issues);
    return data as CreateUserRequest;
  }

  private validateVerifyBody(body: unknown): VerifyEmailRequest {
    const data = (body ?? {}) as Partial<VerifyEmailRequest>;
    if (typeof data.token !== "string" || data.token.length === 0) {
      throw new ValidationError(["token is required"]);
    }
    return data as VerifyEmailRequest;
  }

  private validateNotificationPreferencesBody(
    body: unknown,
  ): UpdateNotificationPreferencesRequest {
    const data = (body ?? {}) as Partial<UpdateNotificationPreferencesRequest>;
    const issues: string[] = [];

    if (typeof data.notificationRadius !== "number") {
      issues.push("notificationRadius must be a number");
    } else if (!Number.isInteger(data.notificationRadius)) {
      issues.push("notificationRadius must be an integer");
    } else if (
      data.notificationRadius < 1 ||
      data.notificationRadius > 100
    ) {
      issues.push(
        "notificationRadius must be between 1 and 100 kilometers",
      );
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    return data as UpdateNotificationPreferencesRequest;
  }

  private toCreateInput(body: CreateUserRequest): CreateUserInput {
    return new CreateUserInput(body.email, body.username, body.password);
  }

  private validateUpdateProfileBody(body: unknown): UpdateProfileRequest {
    const data = (body ?? {}) as Partial<UpdateProfileRequest>;
    const issues: string[] = [];

    if (data.name && typeof data.name !== "string") {
      issues.push("name must be a string");
    }
    if (data.lastname && typeof data.lastname !== "string") {
      issues.push("lastname must be a string");
    }
    if (data.username && typeof data.username !== "string") {
      issues.push("username must be a string");
    }
    if (data.photoUrl && typeof data.photoUrl !== "string") {
      issues.push("photoUrl must be a string");
    }

    if (issues.length > 0) {
      throw new ValidationError(issues);
    }

    return data as UpdateProfileRequest;
  }

  private handleError(error: unknown, res: Response): void {
    if (
      error instanceof ValidationError ||
      error instanceof InvalidEmailError ||
      error instanceof InvalidUsernameError ||
      error instanceof InvalidNotificationRadiusError
    ) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof EmailAlreadyExistsError) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error instanceof InvalidVerificationTokenError) {
      res.status(400).json({ error: error.message, reason: error.reason });
      return;
    }
    if (error instanceof UserNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
}
