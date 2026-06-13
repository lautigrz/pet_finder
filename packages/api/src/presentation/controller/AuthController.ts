import { Request, Response } from "express";
import { LoginUserUseCase } from "../../application/usecase/login-user/login-user.usecase";
import { LoginUserInput } from "../../application/usecase/login-user/login-user.input";
import { LogoutUserUseCase } from "../../application/usecase/logout-user/logout-user.usecase";
import { LogoutUserInput } from "../../application/usecase/logout-user/logout-user.input";
import { RefreshAccessTokenUseCase } from "../../application/usecase/refresh-access-token/refresh-access-token.usecase";
import { RefreshAccessTokenInput } from "../../application/usecase/refresh-access-token/refresh-access-token.input";
import { RequestPasswordResetUseCase } from "../../application/usecase/request-password-reset/request-password-reset.usecase";
import { RequestPasswordResetInput } from "../../application/usecase/request-password-reset/request-password-reset.input";
import { ResetPasswordUseCase } from "../../application/usecase/reset-password/reset-password.usecase";
import { ResetPasswordInput } from "../../application/usecase/reset-password/reset-password.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import {
  LoginBody,
  LogoutBody,
  RefreshBody,
  ForgotPasswordBody,
  ResetPasswordBody,
} from "../schemas/auth/auth.schema";

export class AuthController {
  constructor(
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase,
    private readonly refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) { }

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.validated?.body as LoginBody;
    const output = await this.loginUserUseCase.execute(new LoginUserInput(email, password));
    res.status(200).json({
      accessToken: output.accessToken,
      refreshToken: output.refreshToken,
    });
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.validated?.body as LogoutBody;
    await this.logoutUserUseCase.execute(new LogoutUserInput(refreshToken));
    res.status(204).send();
  });

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.validated?.body as RefreshBody;
    const output = await this.refreshAccessTokenUseCase.execute(
      new RefreshAccessTokenInput(refreshToken),
    );
    res.status(200).json({ accessToken: output.accessToken });
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.validated?.body as ForgotPasswordBody;
    await this.requestPasswordResetUseCase.execute(new RequestPasswordResetInput(email));
    res.status(200).json({ message: "If the email exists, a reset link was sent" });
  });

  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.validated?.body as ResetPasswordBody;
    await this.resetPasswordUseCase.execute(new ResetPasswordInput(token, newPassword));
    res.status(200).json({ message: "Password updated" });
  });
}
