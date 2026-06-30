import { Request, Response } from "express";
import { LogoutUserUseCase } from "@application/usecase/logout-user/logout-user.usecase";
import { LogoutUserInput } from "@application/usecase/logout-user/logout-user.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { LogoutBody } from "@presentation/schemas/auth/auth.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class LogoutController {
  constructor(
    @inject("LogoutUserUseCase")
    private readonly logoutUserUseCase: LogoutUserUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.validated?.body as LogoutBody;
    await this.logoutUserUseCase.execute(new LogoutUserInput(refreshToken));
    res.status(204).send();
  });
}
