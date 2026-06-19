import { ReportRepository } from "../../../domain/report/repositories/report.repository";
import { INotificationPreferencesRepository } from "../../../domain/repositories/INotificationPreferencesRepository";
import { IDeviceTokenRepository } from "../../../domain/repositories/IDeviceTokenRepository";
import { IPushSender, PushNotification } from "../../../domain/services/IPushSender";
import { NotificationPreference } from "../../../domain/entities/NotificationPreference";
import { Report } from "../../../domain/report/aggregates/ReportAggregate";
import { Location } from "../../../domain/report/value-objects/location.vo";
import { ReportType } from "../../../domain/report/types/report.type";
import { ReportStatus } from "../../../domain/report/types/report.status";
import { GeoPoint, haversineKm } from "../../../domain/shared/geo/haversine";
import { ReportQuery } from "../report-usecase/report-query";
import { GetFilteredReportsDTO } from "../report-usecase/dto/get-filtered-reports.dto";

export class NotifyNearbyLostOwnersUseCase {
    constructor(
        private readonly reportRepository: ReportRepository,
        private readonly notificationPreferencesRepository: INotificationPreferencesRepository,
        private readonly deviceTokenRepository: IDeviceTokenRepository,
        private readonly pushSender: IPushSender,
    ) { }

    async execute(sightingPublicId: string): Promise<void> {
        const sighting = await this.reportRepository.findByPublicId(sightingPublicId);
        if (!sighting || sighting.reportType !== ReportType.SIGHTING) return;
        const owners = await this.eligibleOwners(sighting);
        await this.notifyOwners(owners, sightingPublicId);
    }

    private async eligibleOwners(sighting: Report): Promise<string[]> {
        const point = this.toPoint(sighting.location);
        const lostReports = await this.activeLostReports();
        const eligible = new Set<string>();
        for (const report of lostReports) {
            if (this.shouldSkip(report, sighting.userPublicId, eligible)) continue;
            if (await this.isOwnerInRange(report, point)) eligible.add(report.userPublicId);
        }
        return [...eligible];
    }

    private shouldSkip(report: Report, reporterPublicId: string, eligible: Set<string>): boolean {
        return report.userPublicId === reporterPublicId || eligible.has(report.userPublicId);
    }

    private async isOwnerInRange(report: Report, sighting: GeoPoint): Promise<boolean> {
        const prefs = await this.notificationPreferencesRepository.getOrCreateByUserPublicId(report.userPublicId);
        if (!this.acceptsSightings(prefs)) return false;
        return haversineKm(this.toPoint(report.location), sighting) <= prefs.notificationRadius;
    }

    private acceptsSightings(prefs: NotificationPreference): boolean {
        const muted = prefs.mutedUntil !== null && prefs.mutedUntil > new Date();
        return prefs.sightingReportsEnabled && !muted;
    }

    private async notifyOwners(owners: string[], sightingPublicId: string): Promise<void> {
        const tokens = await this.collectTokens(owners);
        if (tokens.length === 0) return;
        const deadTokens = await this.pushSender.send(tokens, this.buildNotification(sightingPublicId));
        await this.pruneDeadTokens(deadTokens);
    }

    private async pruneDeadTokens(tokens: string[]): Promise<void> {
        if (tokens.length === 0) return;
        await this.deviceTokenRepository.deleteByTokens(tokens);
    }

    private async collectTokens(owners: string[]): Promise<string[]> {
        const lists = await Promise.all(
            owners.map((owner) => this.deviceTokenRepository.findTokensByUser(owner)),
        );
        return lists.flat();
    }

    private async activeLostReports(): Promise<Report[]> {
        const query = new ReportQuery({ reportType: ReportType.LOST, status: ReportStatus.ACTIVE } as GetFilteredReportsDTO);
        const ids = await this.reportRepository.findIdsByQuery(query);
        const found = await this.reportRepository.findByIds(ids);
        return found.map((item) => item.report);
    }

    private buildNotification(sightingPublicId: string): PushNotification {
        return {
            title: "Avistamiento cerca de tu mascota 🐾",
            body: "Alguien vio una mascota cerca de donde perdiste la tuya. Tocá para verla.",
            data: { reportId: sightingPublicId },
        };
    }

    private toPoint(location: Location): GeoPoint {
        return { latitude: location.latitude, longitude: location.longitude };
    }
}
