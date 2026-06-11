import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetNotificationPreferencesUseCase } from "../get-notification-preferences.usecase";
import { NotificationPreference } from "../../../../domain/entities/NotificationPreference";
import type { INotificationPreferencesRepository } from "../../../../domain/repositories/INotificationPreferencesRepository";

describe("GetNotificationPreferencesUseCase", () => {
  let notificationPreferencesRepository: INotificationPreferencesRepository;
  let useCase: GetNotificationPreferencesUseCase;

  beforeEach(() => {
    notificationPreferencesRepository = {
      getOrCreateByUserPublicId: vi.fn(),
      updateByUserPublicId: vi.fn(),
    };

    useCase = new GetNotificationPreferencesUseCase(
      notificationPreferencesRepository,
    );
  });

  describe("when the user has notification preferences", () => {
    it("returns all the persisted preferences", async () => {
      // Given unas preferencias guardadas para Facundo
      const preferences = NotificationPreference.reconstruct(
        10,
        42,
        5,
        true,
        false,
        true,
        null,
        new Date("2026-06-10T12:00:00.000Z"),
        new Date("2026-06-10T12:00:00.000Z"),
      );

      vi.mocked(
        notificationPreferencesRepository.getOrCreateByUserPublicId,
      ).mockResolvedValue(preferences);

      // When consulto las preferencias del usuario
      const output = await useCase.execute("facundo-public-id");

      // Then el repositorio busca por publicId
      expect(
        notificationPreferencesRepository.getOrCreateByUserPublicId,
      ).toHaveBeenCalledWith("facundo-public-id");

      // Then devuelve los valores persistidos
      expect(output).toEqual({
        notificationRadius: 5,
        lostReportsEnabled: true,
        sightingReportsEnabled: false,
        matchesEnabled: true,
        mutedUntil: null,
      });
    });

    it("returns the persisted mute expiration date", async () => {
      // Given preferencias silenciadas temporalmente
      const mutedUntil = new Date("2026-06-15T18:00:00.000Z");

      const preferences = NotificationPreference.reconstruct(
        10,
        42,
        10,
        true,
        true,
        false,
        mutedUntil,
        new Date("2026-06-10T12:00:00.000Z"),
        new Date("2026-06-11T12:00:00.000Z"),
      );

      vi.mocked(
        notificationPreferencesRepository.getOrCreateByUserPublicId,
      ).mockResolvedValue(preferences);

      // When consulto las preferencias
      const output = await useCase.execute("facundo-public-id");

      // Then se devuelve también la fecha de finalización del mute
      expect(output.notificationRadius).toBe(10);
      expect(output.matchesEnabled).toBe(false);
      expect(output.mutedUntil).toEqual(mutedUntil);
    });
  });

  describe("when the user does not have preferences yet", () => {
    it("uses the repository get-or-create operation", async () => {
      // Given un repositorio que crea y devuelve preferencias por defecto
      const defaultPreferences = NotificationPreference.createDefault(42);

      vi.mocked(
        notificationPreferencesRepository.getOrCreateByUserPublicId,
      ).mockResolvedValue(defaultPreferences);

      // When consulto las preferencias
      const output = await useCase.execute("facundo-public-id");

      // Then se utiliza la operación que garantiza su existencia
      expect(
        notificationPreferencesRepository.getOrCreateByUserPublicId,
      ).toHaveBeenCalledOnce();

      expect(output).toEqual({
        notificationRadius: 5,
        lostReportsEnabled: true,
        sightingReportsEnabled: true,
        matchesEnabled: true,
        mutedUntil: null,
      });
    });
  });

  describe("when the repository fails", () => {
    it("propagates the repository error", async () => {
      // Given un repositorio que falla
      vi.mocked(
        notificationPreferencesRepository.getOrCreateByUserPublicId,
      ).mockRejectedValue(new Error("database unavailable"));

      // When intento consultar las preferencias
      const action = () => useCase.execute("facundo-public-id");

      // Then el error se propaga
      await expect(action).rejects.toThrow("database unavailable");
    });
  });
});