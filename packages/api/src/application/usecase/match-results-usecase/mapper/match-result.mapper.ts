
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { DetailsReportDTO } from "../dto/match-result.dto";
import { SightingReportDetails } from "@domain/report/value-objects/sighting-report-details.vo";

export class MatchResultMapper {


    static toDetailsReportDTO(report: Report, pet?: Pet): DetailsReportDTO | null {

        if (pet) {
            return {
                publicId: report.publicId,
                images: pet.images.map(img => img.photoUrl),
                animalType: pet.animalType
            }
        }

        if (report.details instanceof SightingReportDetails) {
            return {
                publicId: report.publicId,
                animalType: report.details.animalType,
                images: report.details.images.map(img => img.photoUrl),
            }
        }

        return null;

    }


}