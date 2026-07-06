import { describe, expect, it, vi, beforeEach } from "vitest";
import { NotifyOwnerOfMatchUseCase } from "../notify-owner-of-match.usecase";
import { SendPushToUserUseCase } from "../../send-push-to-user/send-push-to-user.usecase";
import type { IUserRepository } from "../../../../domain/repositories/IUserRepository";
import type { IEmailService } from "../../../../domain/services/IEmailService";
import type { INotificationPreferencesRepository } from "../../../../domain/repositories/INotificationPreferencesRepository";
import { NotificationPreference } from "../../../../domain/entities/NotificationPreference";

describe("NotifyOwnerOfMatchUseCase", () => {
  let sendPushToUserUseCase: SendPushToUserUseCase;
  let userRepository: IUserRepository;
  let emailService: IEmailService;
  let notificationPreferencesRepository: INotificationPreferencesRepository;
  let useCase: NotifyOwnerOfMatchUseCase;

  const defaultPreferences = {
    notificationRadius: 5,
    lostReportsEnabled: true,
    sightingReportsEnabled: true,
    matchesEnabled: true,
    mutedUntil: null,
  } as NotificationPreference;

  const notification = {
    ownerPublicId: "owner-public-id",
    lostPetName: "Milo",
    score: 0.87,
    lostReportPublicId: "lost-report-public-id",
    lostPetImage: "lost-pet-image.jpg",
    matchedImage: "matched-image.jpg",
    rol: "dueno",
  };

  beforeEach(() => {
    sendPushToUserUseCase = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as SendPushToUserUseCase;

    userRepository = {
      findByPublicId: vi.fn().mockResolvedValue({
        email: "owner@test.com",
      }),
    } as unknown as IUserRepository;

    emailService = {
      sendMatchAlert: vi.fn().mockResolvedValue(undefined),
    } as unknown as IEmailService;

    notificationPreferencesRepository = {
      getOrCreateByUserPublicId: vi.fn().mockResolvedValue(defaultPreferences),
    } as unknown as INotificationPreferencesRepository;

    useCase = new NotifyOwnerOfMatchUseCase(
      sendPushToUserUseCase,
      userRepository,
      emailService,
      notificationPreferencesRepository,
    );
  });

  it("sends a push to the owner with the match details", async () => {
    await useCase.execute(notification as any);

    expect(
      notificationPreferencesRepository.getOrCreateByUserPublicId,
    ).toHaveBeenCalledWith("owner-public-id");

    expect(sendPushToUserUseCase.execute).toHaveBeenCalledOnce();

    const input = vi.mocked(sendPushToUserUseCase.execute).mock.calls[0]![0];

    expect(input.userPublicId).toBe("owner-public-id");
    expect(input.notification.title).toBe("¡Posible coincidencia de tu mascota! 🐾");
    expect(input.notification.body).toBe(
      "Encontramos una coincidencia del 87% con Milo. Tocá para verla.",
    );
    expect(input.notification.data).toEqual({
      reportId: "lost-report-public-id",
    });
  });

  it("uses a fallback name when the lost pet has no name", async () => {
    await useCase.execute({
      ...notification,
      lostPetName: null,
    } as any);

    const input = vi.mocked(sendPushToUserUseCase.execute).mock.calls[0]![0];

    expect(input.notification.body).toBe(
      "Encontramos una coincidencia del 87% con tu mascota. Tocá para verla.",
    );
  });

  it("emails the owner with their own lost pet photo", async () => {
    await useCase.execute({
      ...notification,
      rol: "dueno",
    } as any);

    expect(emailService.sendMatchAlert).toHaveBeenCalledWith(
      "owner@test.com",
      "Milo",
      87,
      "lost-report-public-id",
      "lost-pet-image.jpg",
    );
  });

  it("emails the sighting reporter with the photo from their own report", async () => {
    await useCase.execute({
      ...notification,
      rol: "avistador",
    } as any);

    expect(emailService.sendMatchAlert).toHaveBeenCalledWith(
      "owner@test.com",
      "Milo",
      87,
      "lost-report-public-id",
      "matched-image.jpg",
    );
  });

  it("emails the fallback name when the lost pet has no name", async () => {
    await useCase.execute({
      ...notification,
      lostPetName: null,
    } as any);

    expect(emailService.sendMatchAlert).toHaveBeenCalledWith(
      "owner@test.com",
      "tu mascota",
      87,
      "lost-report-public-id",
      "lost-pet-image.jpg",
    );
  });

  it("skips the email but still pushes when the owner is not found", async () => {
    vi.mocked(userRepository.findByPublicId).mockResolvedValueOnce(null);

    await useCase.execute(notification as any);

    expect(sendPushToUserUseCase.execute).toHaveBeenCalledOnce();
    expect(emailService.sendMatchAlert).not.toHaveBeenCalled();
  });

  it("does not notify when match notifications are disabled", async () => {
    vi.mocked(
      notificationPreferencesRepository.getOrCreateByUserPublicId,
    ).mockResolvedValueOnce({
      ...defaultPreferences,
      matchesEnabled: false,
    });

    await useCase.execute(notification as any);

    expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
    expect(emailService.sendMatchAlert).not.toHaveBeenCalled();
  });

  it("does not notify when notifications are muted", async () => {
    const mutedUntil = new Date();
    mutedUntil.setHours(mutedUntil.getHours() + 1);

    vi.mocked(
      notificationPreferencesRepository.getOrCreateByUserPublicId,
    ).mockResolvedValueOnce({
      ...defaultPreferences,
      mutedUntil,
    });

    await useCase.execute(notification as any);

    expect(sendPushToUserUseCase.execute).not.toHaveBeenCalled();
    expect(emailService.sendMatchAlert).not.toHaveBeenCalled();
  });
});