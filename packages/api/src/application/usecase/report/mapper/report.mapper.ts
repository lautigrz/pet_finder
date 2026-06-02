import { Report } from "@domain/report/aggregates/ReportAggregate";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { ReportType } from "@domain/report/types/report.type";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";
import { MappingError } from "@application/errors/errors";
import { LostReportOutput, ReportOutput, SightingReportOutput } from "../dto/report.output";


export class ReportOutputMapper {

    static toOutput(report: Report, pet?: Pet): ReportOutput {
        return {
            publicId: report.publicId,
            user: {
                publicId: report.userPublicId
            },
            type: report.reportType,
            status: report.status,
            description: report.description ? report.description.value : "",
            location: {
                address: report.location.address || "",
                latitude: report.location.latitude,
                longitude: report.location.longitude
            },
            details: this.buildDetails(report, pet),
            occurredAt: report.occurredAt,
            createdAt: report.createdAt
        }
    }

    static buildDetails(report: Report, pet?: Pet): SightingReportOutput | LostReportOutput {
        if (report.reportType === ReportType.SIGHTING) {
            const details = report.details as SightingReportDetails;
            return {
                petName: details.petName || "",
                animalType: details.animalType,
                genderType: details.genderType || "",
                sizeType: details.sizeType || "",
                breed: details.breed || "",
                hasIdCollar: details.hasIdCollar,
                isInTransit: details.isInTransit,
                color: details.color,
                images: (details.images || []).map(img => ({
                    url: img.photoUrl
                }))
            }
        } else {
            if (!pet) {
                throw new MappingError("Pet details are required for a lost report");
            }
            return {
                publicId: pet.publicId,
                name: pet.name,
                animalType: pet.animalType,
                genderType: pet.genderType,
                sizeType: pet.sizeType,
                color: pet.color,
                hasIdCollar: pet.hasIdCollar,
                breed: pet.breed,
                images: (pet.images || []).map(img => ({
                    url: img.photoUrl
                }))
            }
        }
    }
}
