import { Request, Response } from "express";
import { LoginUserUseCase } from "../../application/usecase/login-user/login-user.usecase";
import { LoginUserInput } from "../../application/usecase/login-user/login-user.input";
import { InvalidCredentialsError } from "../../domain/errors/InvalidCredentialsError";
import { LoginRequest } from "../dto/LoginRequest";
import { ValidationError } from "../errors/ValidationError";

const EMAIL_MAX_LENGTH = 255;
const PASSWORD_MAX_LENGTH = 100;

export class AuthController {
  constructor(private readonly loginUserUseCase: LoginUserUseCase) {}

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = this.validateLoginBody(req.body);
      const output = await this.loginUserUseCase.execute(
        new LoginUserInput(body.email, body.password),
      );
      res.status(200).json({
        accessToken: output.accessToken,
        refreshToken: output.refreshToken,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private validateLoginBody(body: unknown): LoginRequest {
    const issues: string[] = [];
    const data = (body ?? {}) as Partial<LoginRequest>;
    if (typeof data.email !== "string" || data.email.trim().length === 0) {
      issues.push("email is required");
    } else if (data.email.length > EMAIL_MAX_LENGTH) {
      issues.push(`email must be at most ${EMAIL_MAX_LENGTH} characters`);
    }
    if (typeof data.password !== "string" || data.password.length === 0) {
      issues.push("password is required");
    } else if (data.password.length > PASSWORD_MAX_LENGTH) {
      issues.push(`password must be at most ${PASSWORD_MAX_LENGTH} characters`);
    }
    if (issues.length > 0) throw new ValidationError(issues);
    return data as LoginRequest;
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
}
