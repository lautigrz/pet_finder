import type { UserExpAction } from "@domain/entities/UserExpAction";

export class AwardUserExpInput {
  constructor(
    public readonly userPublicId: string,
    public readonly action: UserExpAction,
  ) {}
}
