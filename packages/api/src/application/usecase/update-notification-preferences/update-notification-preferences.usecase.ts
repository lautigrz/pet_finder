import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserNotFoundError } from '../../../domain/errors/UserNotFoundError';
import { InvalidNotificationRadiusError } from '../../../domain/errors/InvalidNotificationRadiusError';
import { UpdateNotificationPreferencesInput } from './update-notification-preferences.input';
import { UpdateNotificationPreferencesOutput } from './update-notification-preferences.output';
import { User } from '../../../domain/entities/User';

const MIN_NOTIFICATION_RADIUS = 1;
const MAX_NOTIFICATION_RADIUS = 100;

export class UpdateNotificationPreferencesUseCase {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(
    input: UpdateNotificationPreferencesInput,
  ): Promise<UpdateNotificationPreferencesOutput> {
    if (
      !Number.isInteger(input.notificationRadius) ||
      input.notificationRadius < MIN_NOTIFICATION_RADIUS ||
      input.notificationRadius > MAX_NOTIFICATION_RADIUS
    ) {
      throw new InvalidNotificationRadiusError();
    }

    const existingUser = await this.userRepository.findByPublicId(
      input.publicId,
    );

    if (!existingUser) {
      throw new UserNotFoundError();
    }

    const updatedUser =
      await this.userRepository.updateNotificationPreferences(
        input.publicId,
        input.notificationRadius,
      );

    return new UpdateNotificationPreferencesOutput(
      updatedUser.notificationRadius,
    );
  }
}
