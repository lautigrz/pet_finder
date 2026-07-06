import { Request, Response } from "express";
import { GetColorsUseCase } from "@application/usecase/catalog/get-colors.usecase";
import { asyncHandler } from "@presentation/handler/async-handler";
import { inject, injectable } from "tsyringe";

@injectable()
export class GetColorsController {
  constructor(
    @inject("GetColorsUseCase")
    private readonly getColorsUseCase: GetColorsUseCase,
  ) {}

  handle = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const colors = await this.getColorsUseCase.execute();
    res.status(200).json(colors);
  });
}
