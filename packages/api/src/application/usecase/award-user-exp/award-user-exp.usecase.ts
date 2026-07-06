import { inject, injectable } from "tsyringe";
import { getExpForAction } from "@domain/entities/UserExpAction";
import type { IUserExperienceRepository } from "@domain/repositories/IUserExperienceRepository";
import { AwardUserExpInput } from "./award-user-exp.input";
import { AwardUserExpOutput } from "./award-user-exp.output";

@injectable()
export class AwardUserExpUseCase {
  constructor(
    @inject("UserExperienceRepository")
    private readonly userExperienceRepository: IUserExperienceRepository,
  ) {}

  async execute(input: AwardUserExpInput): Promise<AwardUserExpOutput> {
    const awardedExp = getExpForAction(input.action);
    const user = await this.userExperienceRepository.addExp(input.userPublicId, input.action, awardedExp);

    return new AwardUserExpOutput(user.id, input.action, awardedExp, user.exp);
  }
}
