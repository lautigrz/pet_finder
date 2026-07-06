import { Request, Response } from "express";
import { RequestPasswordResetUseCase } from "@application/usecase/request-password-reset/request-password-reset.usecase";
import { RequestPasswordResetInput } from "@application/usecase/request-password-reset/request-password-reset.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { ForgotPasswordBody } from "@presentation/schemas/auth/auth.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class ForgotPasswordController {
  constructor(
    @inject("RequestPasswordResetUseCase")
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.validated?.body as ForgotPasswordBody;
    await this.requestPasswordResetUseCase.execute(new RequestPasswordResetInput(email));
    res.status(200).json({ message: "If the email exists, a reset link was sent" });
  });
}
