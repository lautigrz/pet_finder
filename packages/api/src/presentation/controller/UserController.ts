import { Request, Response } from "express";
import { CreateUserUseCase } from "../../application/usecase/create-user/create-user.usecase";
import { CreateUserInput } from "../../application/usecase/create-user/create-user.input";
import { SendEmailVerificationUseCase } from "../../application/usecase/send-email-verification/send-email-verification.usecase";
import { SendEmailVerificationInput } from "../../application/usecase/send-email-verification/send-email-verification.input";
import { VerifyEmailUseCase } from "../../application/usecase/verify-email/verify-email.usecase";
import { VerifyEmailInput } from "../../application/usecase/verify-email/verify-email.input";
import { EmailAlreadyExistsError } from "../../domain/errors/EmailAlreadyExistsError";
import { InvalidEmailError } from "../../domain/errors/InvalidEmailError";
import { InvalidVerificationTokenError } from "../../domain/errors/InvalidVerificationTokenError";
import { CreateUserRequest } from "../dto/CreateUserRequest";
import { VerifyEmailRequest } from "../dto/VerifyEmailRequest";
import { ValidationError } from "../errors/ValidationError";

const PASSWORD_MIN_LENGTH = 8;

export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly sendEmailVerificationUseCase: SendEmailVerificationUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
  ) {}

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

  private validateCreateBody(body: unknown): CreateUserRequest {
    const issues: string[] = [];
    const data = (body ?? {}) as Partial<CreateUserRequest>;
    if (typeof data.email !== "string" || data.email.trim().length === 0) {
      issues.push("email is required");
    }
    if (typeof data.password !== "string") {
      issues.push("password is required");
    } else if (data.password.length < PASSWORD_MIN_LENGTH) {
      issues.push(`password must be at least ${PASSWORD_MIN_LENGTH} characters`);
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

  private toCreateInput(body: CreateUserRequest): CreateUserInput {
    return new CreateUserInput(body.email, body.password);
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ValidationError || error instanceof InvalidEmailError) {
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
    res.status(500).json({ error: "Internal server error" });
  }
}
