import type { UserExpAction } from "@domain/entities/UserExpAction";

export class AwardUserExpOutput {
  constructor(
    public readonly userPublicId: string,
    public readonly action: UserExpAction,
    public readonly awardedExp: number,
    public readonly totalExp: number,
  ) {}
}
