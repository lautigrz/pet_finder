import { Request, Response } from "express";
import { RegisterUserUseCase } from "@application/usecase/register-user/register-user.usecase";
import { RegisterUserInput } from "@application/usecase/register-user/register-user.input";
import { asyncHandler } from "@presentation/handler/async-handler";
import { CreateUserBody } from "@presentation/schemas/user/user.schema";
import { inject, injectable } from "tsyringe";

@injectable()
export class CreateUserController {
  constructor(
    @inject("RegisterUserUseCase")
    private readonly registerUserUseCase: RegisterUserUseCase,
  ) {}

  handle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const body = req.validated?.body as CreateUserBody;
    const created = await this.registerUserUseCase.execute(
      new RegisterUserInput(body.email, body.username, body.password),
    );
    res.status(201).json({ id: created.userId });
  });
}
