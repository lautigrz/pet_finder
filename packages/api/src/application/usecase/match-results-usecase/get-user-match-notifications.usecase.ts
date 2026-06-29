import { MatchNotification, MATCH_NOTIFICATION_THRESHOLD } from "@pet-alert/shared";
import type { MatchResultsRepository } from "@domain/match/repositories/match-results.repository";
import { injectable, inject } from "tsyringe";

@injectable()
export class GetUserMatchNotificationsUseCase {
    constructor(
        @inject("MatchResultsRepository")
        private readonly matchResultsRepository: MatchResultsRepository,
    ) { }

    async execute(userPublicId: string): Promise<MatchNotification[]> {
        const notifications = await this.matchResultsRepository.findNotificationsByUser(userPublicId);
        return notifications.filter((notification) => notification.score >= MATCH_NOTIFICATION_THRESHOLD);
    }
}
