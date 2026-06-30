import { Request, Response } from "express";
import { LoginUserUseCase } from "@application/usecase/login-user/login-user.usecase";
import { LoginUserInput } from "@application/usecase/login-user/login-user.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { LoginBody } from "@presentation/schemas/auth/auth.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class LoginController {
  constructor(
    @inject("LoginUserUseCase")
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.validated?.body as LoginBody;
    const output = await this.loginUserUseCase.execute(new LoginUserInput(email, password));
    res.status(200).json({
      accessToken: output.accessToken,
      refreshToken: output.refreshToken,
    });
  });
}
