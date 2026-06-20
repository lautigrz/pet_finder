import { MatchNotification, MATCH_NOTIFICATION_THRESHOLD } from "@pet-alert/shared";
import { MatchResultsRepository } from "@domain/match/repositories/match-results.repository";


export class GetUserMatchNotificationsUseCase {
    constructor(
        private readonly matchResultsRepository: MatchResultsRepository,
    ) { }

    async execute(userPublicId: string): Promise<MatchNotification[]> {
        const notifications = await this.matchResultsRepository.findNotificationsByUser(userPublicId);
        return notifications.filter((notification) => notification.score >= MATCH_NOTIFICATION_THRESHOLD);
    }
}
