import { AppealTargetType } from "@domain/appeal/types/appeal-target-type";

export class NotifyAppealResultInput {
    constructor(
        public readonly appellantUserId: number,
        public readonly accepted: boolean,
        public readonly targetType: AppealTargetType,
    ) { }
}
