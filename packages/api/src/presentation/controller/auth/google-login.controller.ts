import { Request, Response } from "express";
import { LoginWithGoogleUseCase } from "@application/usecase/login-with-google/login-with-google.usecase";
import { LoginWithGoogleInput } from "@application/usecase/login-with-google/login-with-google.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { GoogleLoginBody } from "@presentation/schemas/auth/auth.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class GoogleLoginController {
  constructor(
    @inject("LoginWithGoogleUseCase")
    private readonly loginWithGoogleUseCase: LoginWithGoogleUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code } = req.validated?.body as GoogleLoginBody;
    const output = await this.loginWithGoogleUseCase.execute(new LoginWithGoogleInput(code));
    res.status(200).json({
      accessToken: output.accessToken,
      refreshToken: output.refreshToken,
    });
  });
}
