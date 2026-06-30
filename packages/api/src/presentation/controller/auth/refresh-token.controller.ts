import { Request, Response } from "express";
import { RefreshAccessTokenUseCase } from "@application/usecase/refresh-access-token/refresh-access-token.usecase";
import { RefreshAccessTokenInput } from "@application/usecase/refresh-access-token/refresh-access-token.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { RefreshBody } from "@presentation/schemas/auth/auth.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class RefreshTokenController {
  constructor(
    @inject("RefreshAccessTokenUseCase")
    private readonly refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.validated?.body as RefreshBody;
    const output = await this.refreshAccessTokenUseCase.execute(
      new RefreshAccessTokenInput(refreshToken),
    );
    res.status(200).json({ accessToken: output.accessToken });
  });
}
