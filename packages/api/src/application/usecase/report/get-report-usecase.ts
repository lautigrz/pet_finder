import { PetRepository } from "@domain/pet/repositories/pet.repository";
import { Report } from "@domain/report/aggregates/ReportAggregate";
import { ReportRepository } from "@domain/report/repositories/report.repository";
import { ReportOutputMapper } from "./mapper/report.mapper";
import { LostReportDetails } from "@domain/report/value-objects/lost-report-details.vo";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { PetNotFoundError } from "@domain/errors/PetNotFoundError";


export class GetReportUseCase {
    constructor(private reportRepository: ReportRepository, private petRepository: PetRepository) { }



    async execute(publicId: string) {
        const report: Report | null = await this.reportRepository.findByPublicId(publicId)

        if (!report) {
            throw new ReportNotFoundError(publicId)
        }

        if (report.reportType === "lost") {
            const petDetails = report.details as LostReportDetails;
            const pet = await this.petRepository.findById(petDetails.petId)
            if (!pet) {
                throw new PetNotFoundError(petDetails.petId)
            }
            return ReportOutputMapper.toOutput(report, pet)
        }



        return ReportOutputMapper.toOutput(report)
    }


}