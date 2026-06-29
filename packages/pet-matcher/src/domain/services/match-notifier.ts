import { MatchNotification } from '@pet-alert/shared';

export interface IMatchNotifier {
  publish(notification: MatchNotification): Promise<void>;
}
