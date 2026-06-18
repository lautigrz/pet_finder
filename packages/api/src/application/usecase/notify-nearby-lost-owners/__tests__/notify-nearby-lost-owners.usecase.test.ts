import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotifyNearbyLostOwnersUseCase } from "../notify-nearby-lost-owners.usecase";
import { Report } from "../../../../domain/report/aggregates/ReportAggregate";
import { Location } from "../../../../domain/report/value-objects/location.vo";
import { ReportType } from "../../../../domain/report/types/report.type";
import { ReportStatus } from "../../../../domain/report/types/report.status";
import { NotificationPreference } from "../../../../domain/entities/NotificationPreference";
import type { ReportRepository } from "../../../../domain/report/repositories/report.repository";
import type { INotificationPreferencesRepository } from "../../../../domain/repositories/INotificationPreferencesRepository";
import type { IDeviceTokenRepository } from "../../../../domain/repositories/IDeviceTokenRepository";
import type { IPushSender } from "../../../../domain/services/IPushSender";

function makeReport(opts: {
  type: ReportType;
  userPublicId: string;
  lat: number;
  lng: number;
  publicId?: string;
}): Report {
  return Report.restore({
    idReport: 1,
    publicId: opts.publicId ?? "report-1",
    userId: 1,
    userPublicId: opts.userPublicId,
    type: opts.type,
    currentStatus: ReportStatus.ACTIVE,
    description: null,
    details: {} as never,
    location: Location.create({ address: null, latitude: opts.lat, longitude: opts.lng }),
    occurredAt: new Date("2026-06-18T00:00:00.000Z"),
    createdAt: new Date("2026-06-18T00:00:00.000Z"),
    updatedAt: null,
  });
}

function makePrefs(opts: { radius?: number; sighting?: boolean; mutedUntil?: Date | null }): NotificationPreference {
  return NotificationPreference.reconstruct(
    1, 42, opts.radius ?? 5, true, opts.sighting ?? true, true, opts.mutedUntil ?? null,
    new Date("2026-06-18T00:00:00.000Z"), new Date("2026-06-18T00:00:00.000Z"),
  );
}

describe("NotifyNearbyLostOwnersUseCase", () => {
  let reportRepository: { findByPublicId: ReturnType<typeof vi.fn>; findIdsByQuery: ReturnType<typeof vi.fn>; findByIds: ReturnType<typeof vi.fn> };
  let notificationPreferencesRepository: { getOrCreateByUserPublicId: ReturnType<typeof vi.fn>; updateByUserPublicId: ReturnType<typeof vi.fn> };
  let deviceTokenRepository: { registerForUser: ReturnType<typeof vi.fn>; removeForUser: ReturnType<typeof vi.fn>; findTokensByUser: ReturnType<typeof vi.fn> };
  let pushSender: { send: ReturnType<typeof vi.fn> };
  let useCase: NotifyNearbyLostOwnersUseCase;

  const sighting = makeReport({ type: ReportType.SIGHTING, userPublicId: "reporter", lat: 0, lng: 0, publicId: "sighting-1" });

  beforeEach(() => {
    reportRepository = { findByPublicId: vi.fn(), findIdsByQuery: vi.fn().mockResolvedValue(["lost-1"]), findByIds: vi.fn() };
    notificationPreferencesRepository = { getOrCreateByUserPublicId: vi.fn(), updateByUserPublicId: vi.fn() };
    deviceTokenRepository = { registerForUser: vi.fn(), removeForUser: vi.fn(), findTokensByUser: vi.fn() };
    pushSender = { send: vi.fn() };
    useCase = new NotifyNearbyLostOwnersUseCase(
      reportRepository as unknown as ReportRepository,
      notificationPreferencesRepository as unknown as INotificationPreferencesRepository,
      deviceTokenRepository as unknown as IDeviceTokenRepository,
      pushSender as unknown as IPushSender,
    );
    reportRepository.findByPublicId.mockResolvedValue(sighting);
  });

  function withLostReport(report: Report): void {
    reportRepository.findByIds.mockResolvedValue([{ report }]);
  }

  it("notifies the owner of a lost report within radius", async () => {
    // Given una perdida muy cerca del avistamiento, dueño con tokens y aviso activado
    withLostReport(makeReport({ type: ReportType.LOST, userPublicId: "owner-1", lat: 0, lng: 0.01 }));
    notificationPreferencesRepository.getOrCreateByUserPublicId.mockResolvedValue(makePrefs({ radius: 5 }));
    deviceTokenRepository.findTokensByUser.mockResolvedValue(["tok-1"]);

    // When llega el avistamiento
    await useCase.execute("sighting-1");

    // Then se le manda push a sus tokens
    expect(pushSender.send).toHaveBeenCalledOnce();
    expect(pushSender.send).toHaveBeenCalledWith(["tok-1"], expect.anything());
  });

  it("does not notify when the lost report is outside the radius", async () => {
    // Given una perdida a ~111 km (1 grado de longitud) con radio 5
    withLostReport(makeReport({ type: ReportType.LOST, userPublicId: "owner-1", lat: 0, lng: 1 }));
    notificationPreferencesRepository.getOrCreateByUserPublicId.mockResolvedValue(makePrefs({ radius: 5 }));
    deviceTokenRepository.findTokensByUser.mockResolvedValue(["tok-1"]);

    // When
    await useCase.execute("sighting-1");

    // Then no se envía
    expect(pushSender.send).not.toHaveBeenCalled();
  });

  it("does not notify when notifications are muted", async () => {
    // Given dueño en rango pero silenciado hasta el futuro
    withLostReport(makeReport({ type: ReportType.LOST, userPublicId: "owner-1", lat: 0, lng: 0.01 }));
    notificationPreferencesRepository.getOrCreateByUserPublicId.mockResolvedValue(
      makePrefs({ mutedUntil: new Date("2999-01-01T00:00:00.000Z") }),
    );
    deviceTokenRepository.findTokensByUser.mockResolvedValue(["tok-1"]);

    // When / Then
    await useCase.execute("sighting-1");
    expect(pushSender.send).not.toHaveBeenCalled();
  });

  it("does not notify when sighting notifications are disabled", async () => {
    // Given dueño en rango pero con el flag de avistamientos apagado
    withLostReport(makeReport({ type: ReportType.LOST, userPublicId: "owner-1", lat: 0, lng: 0.01 }));
    notificationPreferencesRepository.getOrCreateByUserPublicId.mockResolvedValue(makePrefs({ sighting: false }));
    deviceTokenRepository.findTokensByUser.mockResolvedValue(["tok-1"]);

    // When / Then
    await useCase.execute("sighting-1");
    expect(pushSender.send).not.toHaveBeenCalled();
  });

  it("does not notify the author of the sighting", async () => {
    // Given la perdida cercana es del MISMO usuario que reportó el avistamiento
    withLostReport(makeReport({ type: ReportType.LOST, userPublicId: "reporter", lat: 0, lng: 0.01 }));
    notificationPreferencesRepository.getOrCreateByUserPublicId.mockResolvedValue(makePrefs({}));
    deviceTokenRepository.findTokensByUser.mockResolvedValue(["tok-1"]);

    // When / Then: se saltea, no se le manda a sí mismo
    await useCase.execute("sighting-1");
    expect(pushSender.send).not.toHaveBeenCalled();
  });

  it("ignores reports that are not sightings", async () => {
    // Given el publicId corresponde a un reporte que NO es avistamiento
    reportRepository.findByPublicId.mockResolvedValue(
      makeReport({ type: ReportType.LOST, userPublicId: "reporter", lat: 0, lng: 0 }),
    );

    // When / Then: corta sin buscar nada
    await useCase.execute("sighting-1");
    expect(reportRepository.findIdsByQuery).not.toHaveBeenCalled();
    expect(pushSender.send).not.toHaveBeenCalled();
  });
});
