import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpdateNotificationPreferencesUseCase } from "../update-notification-preferences.usecase";
import { UpdateNotificationPreferencesInput } from "../update-notification-preferences.input";
import { NotificationPreference } from "../../../../domain/entities/NotificationPreference";
import { InvalidNotificationRadiusError } from "../../../../domain/errors/InvalidNotificationRadiusError";
import { InvalidMutedUntilError } from "../../../../domain/errors/InvalidMutedUntilError";
import type {
  INotificationPreferencesRepository,
  UpdateNotificationPreferencesData,
} from "../../../../domain/repositories/INotificationPreferencesRepository";

describe("UpdateNotificationPreferencesUseCase", () => {
  let notificationPreferencesRepository: INotificationPreferencesRepository;
  let useCase: UpdateNotificationPreferencesUseCase;

  beforeEach(() => {
    notificationPreferencesRepository = {
      getOrCreateByUserPublicId: vi.fn(),
      updateByUserPublicId: vi.fn(),
    };

    useCase = new UpdateNotificationPreferencesUseCase(
      notificationPreferencesRepository,
    );
  });

  describe("when the preferences are valid", () => {
    it("updates and returns all notification preferences", async () => {
      // Given preferencias válidas y una respuesta persistida
      const mutedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const updatedPreferences = NotificationPreference.reconstruct(
        10,
        42,
        10,
        false,
        true,
        false,
        mutedUntil,
        new Date("2026-06-10T12:00:00.000Z"),
        new Date("2026-06-11T12:00:00.000Z"),
      );

      vi.mocked(
        notificationPreferencesRepository.updateByUserPublicId,
      ).mockResolvedValue(updatedPreferences);

      // When actualizo todas las preferencias
      const output = await useCase.execute(
        new UpdateNotificationPreferencesInput(
          "facundo-public-id",
          10,
          false,
          true,
          false,
          mutedUntil,
        ),
      );

      // Then se envían los valores al repositorio
      expect(
        notificationPreferencesRepository.updateByUserPublicId,
      ).toHaveBeenCalledWith(
        "facundo-public-id",
        expect.objectContaining({
          notificationRadius: 10,
          lostReportsEnabled: false,
          sightingReportsEnabled: true,
          matchesEnabled: false,
          mutedUntil,
        }),
      );

      // Then devuelve las preferencias persistidas
      expect(output).toEqual({
        notificationRadius: 10,
        lostReportsEnabled: false,
        sightingReportsEnabled: true,
        matchesEnabled: false,
        mutedUntil,
      });
    });

    it("allows updating only the notification radius", async () => {
      // Given un PATCH que solo modifica el radio
      const updatedPreferences = NotificationPreference.reconstruct(
        10,
        42,
        20,
        true,
        true,
        true,
        null,
        new Date(),
        new Date(),
      );

      vi.mocked(
        notificationPreferencesRepository.updateByUserPublicId,
      ).mockResolvedValue(updatedPreferences);

      // When actualizo únicamente notificationRadius
      const output = await useCase.execute(
        new UpdateNotificationPreferencesInput(
          "facundo-public-id",
          20,
        ),
      );

      // Then los demás campos se envían como undefined
      expect(
        notificationPreferencesRepository.updateByUserPublicId,
      ).toHaveBeenCalledWith(
        "facundo-public-id",
        {
          notificationRadius: 20,
          lostReportsEnabled: undefined,
          sightingReportsEnabled: undefined,
          matchesEnabled: undefined,
          mutedUntil: undefined,
        } satisfies UpdateNotificationPreferencesData,
      );

      expect(output.notificationRadius).toBe(20);
    });

    it("allows updating only notification type toggles", async () => {
      // Given un PATCH que modifica solamente los toggles
      const updatedPreferences = NotificationPreference.reconstruct(
        10,
        42,
        5,
        false,
        false,
        true,
        null,
        new Date(),
        new Date(),
      );

      vi.mocked(
        notificationPreferencesRepository.updateByUserPublicId,
      ).mockResolvedValue(updatedPreferences);

      // When actualizo los tipos de notificación
      const output = await useCase.execute(
        new UpdateNotificationPreferencesInput(
          "facundo-public-id",
          undefined,
          false,
          false,
          true,
        ),
      );

      // Then se persisten los toggles recibidos
      expect(
        notificationPreferencesRepository.updateByUserPublicId,
      ).toHaveBeenCalledWith(
        "facundo-public-id",
        expect.objectContaining({
          notificationRadius: undefined,
          lostReportsEnabled: false,
          sightingReportsEnabled: false,
          matchesEnabled: true,
          mutedUntil: undefined,
        }),
      );

      expect(output.lostReportsEnabled).toBe(false);
      expect(output.sightingReportsEnabled).toBe(false);
      expect(output.matchesEnabled).toBe(true);
    });

    it("allows removing the temporary mute with null", async () => {
      // Given preferencias que quedan sin mute
      const updatedPreferences = NotificationPreference.reconstruct(
        10,
        42,
        5,
        true,
        true,
        true,
        null,
        new Date(),
        new Date(),
      );

      vi.mocked(
        notificationPreferencesRepository.updateByUserPublicId,
      ).mockResolvedValue(updatedPreferences);

      // When mando mutedUntil en null
      const output = await useCase.execute(
        new UpdateNotificationPreferencesInput(
          "facundo-public-id",
          undefined,
          undefined,
          undefined,
          undefined,
          null,
        ),
      );

      // Then el repositorio recibe null explícitamente
      expect(
        notificationPreferencesRepository.updateByUserPublicId,
      ).toHaveBeenCalledWith(
        "facundo-public-id",
        expect.objectContaining({
          mutedUntil: null,
        }),
      );

      expect(output.mutedUntil).toBeNull();
    });
  });

  describe("when notification radius is invalid", () => {
    it("throws InvalidNotificationRadiusError when radius is lower than 1", async () => {
      // Given un radio menor al mínimo permitido
      const action = () =>
        useCase.execute(
          new UpdateNotificationPreferencesInput(
            "facundo-public-id",
            0,
          ),
        );

      // Then se rechaza sin llamar al repositorio
      await expect(action).rejects.toThrow(
        InvalidNotificationRadiusError,
      );

      expect(
        notificationPreferencesRepository.updateByUserPublicId,
      ).not.toHaveBeenCalled();
    });

    it("throws InvalidNotificationRadiusError when radius is greater than 100", async () => {
      // Given un radio mayor al máximo permitido
      const action = () =>
        useCase.execute(
          new UpdateNotificationPreferencesInput(
            "facundo-public-id",
            101,
          ),
        );

      // Then se rechaza sin llamar al repositorio
      await expect(action).rejects.toThrow(
        InvalidNotificationRadiusError,
      );

      expect(
        notificationPreferencesRepository.updateByUserPublicId,
      ).not.toHaveBeenCalled();
    });

    it("throws InvalidNotificationRadiusError when radius is decimal", async () => {
      // Given un radio decimal
      const action = () =>
        useCase.execute(
          new UpdateNotificationPreferencesInput(
            "facundo-public-id",
            5.5,
          ),
        );

      // Then se rechaza porque debe ser entero
      await expect(action).rejects.toThrow(
        InvalidNotificationRadiusError,
      );

      expect(
        notificationPreferencesRepository.updateByUserPublicId,
      ).not.toHaveBeenCalled();
    });
  });

  describe("when mutedUntil is invalid", () => {
    it("throws InvalidMutedUntilError for an invalid date", async () => {
      // Given una fecha inválida
      const invalidDate = new Date("invalid-date");

      const action = () =>
        useCase.execute(
          new UpdateNotificationPreferencesInput(
            "facundo-public-id",
            undefined,
            undefined,
            undefined,
            undefined,
            invalidDate,
          ),
        );

      // Then se rechaza sin llamar al repositorio
      await expect(action).rejects.toThrow(InvalidMutedUntilError);

      expect(
        notificationPreferencesRepository.updateByUserPublicId,
      ).not.toHaveBeenCalled();
    });

    it("throws InvalidMutedUntilError when date is in the past", async () => {
      // Given una fecha anterior al momento actual
      const pastDate = new Date(Date.now() - 60_000);

      const action = () =>
        useCase.execute(
          new UpdateNotificationPreferencesInput(
            "facundo-public-id",
            undefined,
            undefined,
            undefined,
            undefined,
            pastDate,
          ),
        );

      // Then se rechaza
      await expect(action).rejects.toThrow(InvalidMutedUntilError);

      expect(
        notificationPreferencesRepository.updateByUserPublicId,
      ).not.toHaveBeenCalled();
    });
  });

  describe("when the repository fails", () => {
    it("propagates the repository error", async () => {
      // Given un repositorio que falla al actualizar
      vi.mocked(
        notificationPreferencesRepository.updateByUserPublicId,
      ).mockRejectedValue(new Error("database unavailable"));

      // When intento actualizar preferencias válidas
      const action = () =>
        useCase.execute(
          new UpdateNotificationPreferencesInput(
            "facundo-public-id",
            10,
          ),
        );

      // Then se propaga el error
      await expect(action).rejects.toThrow("database unavailable");
    });
  });
});