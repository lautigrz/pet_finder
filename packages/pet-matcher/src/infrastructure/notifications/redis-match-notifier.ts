import IORedis from 'ioredis';
import { MATCH_CHANNEL, MatchNotification } from '@pet-alert/shared';
import { IMatchNotifier } from '@domain/services/match-notifier';

export class RedisMatchNotifier implements IMatchNotifier {
  constructor(private readonly publisher: IORedis) {}

  async publish(notification: MatchNotification): Promise<void> {
    await this.publisher.publish(MATCH_CHANNEL, JSON.stringify(notification));
  }
}
