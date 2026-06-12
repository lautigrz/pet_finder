import { ReportRepository, ReportWithPet } from "@domain/report/repositories/report.repository";
import { ReportQuery } from "./report-query";
import { GetFilteredReportsDTO } from "./dto/get-filtered-reports.dto";
import { ReportOutputMapper } from "./mapper/report.mapper";
import { ReportOutput } from "./get-report-usecase";
import { haversineKm } from "@domain/shared/geo/haversine";

export class GetFilteredReportsUseCase {

    constructor(private reportRepository: ReportRepository) { }

    async execute(dto: GetFilteredReportsDTO): Promise<ReportOutput[]> {
        const query = new ReportQuery(dto);

        const ids = await this.reportRepository.findIdsByQuery(query);

        if (ids.length === 0) return [];

        const results = await this.reportRepository.findByIds(ids);

        const withinRadius = this.filterByRadius(results, dto);

        const ordered = this.applySort(withinRadius, dto);

        const outputs = await Promise.all(
            ordered.map(async ({ report, pet }) => {
                const reportImages = await this.reportRepository.findImagesByReportId(report.publicId);
                return ReportOutputMapper.toOutput(report, pet, undefined, reportImages);
            })
        );
        return outputs;

    }

    private filterByRadius(results: ReportWithPet[], dto: GetFilteredReportsDTO): ReportWithPet[] {
        if (dto.lat === undefined || dto.lng === undefined || dto.radiusKm === undefined) {
            return results;
        }

        const origin = { latitude: dto.lat, longitude: dto.lng };

        return results.filter(item =>
            haversineKm(origin, {
                latitude: item.report.location.latitude,
                longitude: item.report.location.longitude,
            }) <= dto.radiusKm!
        );
    }

    private applySort(results: ReportWithPet[], dto: GetFilteredReportsDTO): ReportWithPet[] {
        if (dto.sort === "recent") {
            return this.sortByRecency(results);
        }
        if (dto.lat !== undefined && dto.lng !== undefined) {
            return this.sortByProximity(results, dto.lat, dto.lng);
        }
        return results;
    }

    private sortByProximity(results: ReportWithPet[], lat: number, lng: number): ReportWithPet[] {
        const origin = { latitude: lat, longitude: lng };

        return [...results]
            .map(item => ({
                item,
                distance: haversineKm(origin, {
                    latitude: item.report.location.latitude,
                    longitude: item.report.location.longitude,
                })
            }))
            .sort((a, b) => a.distance - b.distance)
            .map(entry => entry.item);
    }

    private sortByRecency(results: ReportWithPet[]): ReportWithPet[] {
        return [...results].sort(
            (a, b) => b.report.createdAt.getTime() - a.report.createdAt.getTime()
        );
    }

}