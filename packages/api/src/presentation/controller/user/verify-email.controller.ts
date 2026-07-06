import { Request, Response } from "express";
import { VerifyEmailUseCase } from "@application/usecase/verify-email/verify-email.usecase";
import { VerifyEmailInput } from "@application/usecase/verify-email/verify-email.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { VerifyEmailBody } from "@presentation/schemas/user/user.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class VerifyEmailController {
  constructor(
    @inject("VerifyEmailUseCase")
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as VerifyEmailBody;
    await this.verifyEmailUseCase.execute(new VerifyEmailInput(body.token));
    res.status(200).json({ verified: true });
  });
}
