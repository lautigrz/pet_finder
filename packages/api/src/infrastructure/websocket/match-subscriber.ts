import { MATCH_CHANNEL, MATCH_EVENT, MatchNotification } from '@pet-alert/shared';
import { redisConnection } from '@infrastructure/redis/redis.client';
import { emitToUser } from './socket';
import { logger } from '@pet-alert/shared';
import { NotifyOwnerOfMatchUseCase } from '@application/usecase/notify-owner-of-match/notify-owner-of-match.usecase';
import { container } from 'tsyringe';

export function initMatchSubscriber(): void {
    const subscriber = redisConnection.duplicate();
    const notifyOwnerOfMatch = container.resolve(NotifyOwnerOfMatchUseCase);

    subscriber.subscribe(MATCH_CHANNEL, (err) => {
        if (err) {
            logger.error('Failed to subscribe to match notification channel', { error: err });
        }
    });

    subscriber.on('message', (channel, message) => {
        if (channel !== MATCH_CHANNEL) return;

        try {
            const notification = JSON.parse(message) as MatchNotification;
            emitToUser(notification.ownerPublicId, MATCH_EVENT, notification);
            notifyOwnerOfMatch.execute(notification).catch((error) =>
                logger.error('Failed to send match push notification', { error }),
            );
        } catch (error) {
            logger.error('Failed to handle match notification', { error });
        }
    });
}
