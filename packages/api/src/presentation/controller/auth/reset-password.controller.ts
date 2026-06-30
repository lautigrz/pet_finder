import { Request, Response } from "express";
import { ResetPasswordUseCase } from "@application/usecase/reset-password/reset-password.usecase";
import { ResetPasswordInput } from "@application/usecase/reset-password/reset-password.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { ResetPasswordBody } from "@presentation/schemas/auth/auth.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class ResetPasswordController {
  constructor(
    @inject("ResetPasswordUseCase")
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.validated?.body as ResetPasswordBody;
    await this.resetPasswordUseCase.execute(new ResetPasswordInput(token, newPassword));
    res.status(200).json({ message: "Password updated" });
  });
}
