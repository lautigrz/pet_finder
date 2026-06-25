import { InvalidNotificationRadiusError } from "../../../domain/errors/InvalidNotificationRadiusError";
import type {
  INotificationPreferencesRepository,
  UpdateNotificationPreferencesData,
} from "../../../domain/repositories/INotificationPreferencesRepository";
import { UpdateNotificationPreferencesInput } from "./update-notification-preferences.input";
import { UpdateNotificationPreferencesOutput } from "./update-notification-preferences.output";
import { InvalidMutedUntilError } from "../../../domain/errors/InvalidMutedUntilError";
import { inject, injectable } from "tsyringe";

const MIN_NOTIFICATION_RADIUS = 1;
const MAX_NOTIFICATION_RADIUS = 100;

@injectable()
export class UpdateNotificationPreferencesUseCase {
  constructor(
    @inject("NotificationPreferencesRepository")
    private readonly notificationPreferencesRepository: INotificationPreferencesRepository,
  ) { }

  async execute(
    input: UpdateNotificationPreferencesInput,
  ): Promise<UpdateNotificationPreferencesOutput> {
    this.validateNotificationRadius(input.notificationRadius);
    this.validateMutedUntil(input.mutedUntil);

    const data: UpdateNotificationPreferencesData = {
      notificationRadius: input.notificationRadius,
      lostReportsEnabled: input.lostReportsEnabled,
      sightingReportsEnabled: input.sightingReportsEnabled,
      matchesEnabled: input.matchesEnabled,
      mutedUntil: input.mutedUntil,
    };

    const updated = await this.notificationPreferencesRepository.updateByUserPublicId(input.userPublicId, data,);

    return new UpdateNotificationPreferencesOutput(updated.notificationRadius, updated.lostReportsEnabled, updated.sightingReportsEnabled, updated.matchesEnabled, updated.mutedUntil);
  }

  private validateNotificationRadius(notificationRadius?: number,): void {
    if (notificationRadius === undefined) return;

    if (
      !Number.isInteger(notificationRadius) ||
      notificationRadius < MIN_NOTIFICATION_RADIUS ||
      notificationRadius > MAX_NOTIFICATION_RADIUS
    ) {
      throw new InvalidNotificationRadiusError();
    }
  }

  private validateMutedUntil(mutedUntil?: Date | null): void {
    if (mutedUntil === undefined || mutedUntil === null) return;

    if (
      Number.isNaN(mutedUntil.getTime()) ||
      mutedUntil.getTime() <= Date.now()
    ) {
      throw new InvalidMutedUntilError();
    }
  }
}
