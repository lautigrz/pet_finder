import { Request, Response } from "express";
import { LoginUserUseCase } from "../../application/usecase/login-user/login-user.usecase";
import { LoginUserInput } from "../../application/usecase/login-user/login-user.input";
import { InvalidCredentialsError } from "../../domain/errors/InvalidCredentialsError";
import { LoginRequest } from "../dto/LoginRequest";
import { ValidationError } from "../errors/ValidationError";
import { LogoutUserUseCase } from "../../application/usecase/logout-user/logout-user.usecase";
import { LogoutUserInput } from "../../application/usecase/logout-user/logout-user.input";
import { LogoutRequest } from "../dto/LogoutRequest";
import { RefreshAccessTokenUseCase } from "../../application/usecase/refresh-access-token/refresh-access-token.usecase";
import { RefreshAccessTokenInput } from "../../application/usecase/refresh-access-token/refresh-access-token.input";
import { RefreshRequest } from "../dto/RefreshRequest";
import { InvalidRefreshTokenError } from "../../domain/errors/InvalidRefreshTokenError";

const EMAIL_MAX_LENGTH = 255;
const PASSWORD_MAX_LENGTH = 100;

export class AuthController {
  constructor(
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase,
    private readonly refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
  ) {}

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

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = this.validateLogoutBody(req.body);
      await this.logoutUserUseCase.execute(new LogoutUserInput(body.refreshToken));
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res);
    }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = this.validateRefreshBody(req.body);
      const output = await this.refreshAccessTokenUseCase.execute(
        new RefreshAccessTokenInput(body.refreshToken),
      );
      res.status(200).json({ accessToken: output.accessToken });
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

  private validateLogoutBody(body: unknown): LogoutRequest {
    const data = (body ?? {}) as Partial<LogoutRequest>;
    if (typeof data.refreshToken !== "string" || data.refreshToken.length === 0) {
      throw new ValidationError(["refreshToken is required"]);
    }
    return data as LogoutRequest;
  }

  private validateRefreshBody(body: unknown): RefreshRequest {
    const data = (body ?? {}) as Partial<RefreshRequest>;
    if (typeof data.refreshToken !== "string" || data.refreshToken.length === 0) {
      throw new ValidationError(["refreshToken is required"]);
    }
    return data as RefreshRequest;
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof InvalidCredentialsError || error instanceof InvalidRefreshTokenError) {
      res.status(401).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
}
