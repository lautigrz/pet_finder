import { Appeal } from "../Appeal";
import { AppealStatus } from "../types/appeal-status";
import { AppealTargetType } from "../types/appeal-target-type";

export interface AppealAppellant {
    publicId: string;
    username: string;
}

export interface AppealCaseContext {
    reportedContent: { petName: string | null; reportType: string } | null;
    reason: string | null;
    reportCount: number;
}

export interface AppealQueueItem {
    appeal: Appeal;
    appellant: AppealAppellant;
    caseContext: AppealCaseContext;
}

export interface AppealRepository {

    save(appeal: Appeal): Promise<number>;

    findByPublicId(publicId: string): Promise<Appeal | null>;

    update(appeal: Appeal): Promise<void>;

    existsForTarget(targetType: AppealTargetType, targetPublicId: string): Promise<boolean>;

    findQueueByStatus(status: AppealStatus): Promise<AppealQueueItem[]>;
}
