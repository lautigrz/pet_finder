import { MatchNotification } from "@pet-alert/shared";
import { MatchResultsEntity } from "../entities/MatchResultsEntity";


export interface MatchResultsRepository {
    findById(id: number): Promise<MatchResultsEntity | null>;
    findResultsBySourceReportId(sourceReportId: number): Promise<MatchResultsEntity[]>;
    findNotificationsByUser(userPublicId: string): Promise<MatchNotification[]>;
}