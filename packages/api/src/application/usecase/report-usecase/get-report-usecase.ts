import { ReportRepository, ReportWithPet } from "@domain/report/repositories/report.repository";
import { ReportOutputMapper } from "./mapper/report.mapper";
import { ReportNotFoundError } from "@domain/errors/ReportNotFoundError";
import { ReportOutput } from "./dto/report.output";
import { IUserRepository } from "@domain/repositories/IUserRepository";


export type { ReportOutput };

export class GetReportUseCase {
    constructor(private reportRepository: ReportRepository, private userRepository: IUserRepository) { }

    async execute(publicId: string): Promise<ReportOutput> {
    const result = await this.reportRepository.findDetailByPublicId(publicId);
    if (!result) throw new ReportNotFoundError(publicId);

    const { report, pet } = result;
    const user = await this.userRepository.findById(report.userId);
    if (!user) throw new Error("User not found");

    const reportImages = await this.reportRepository.findImagesByReportId(publicId);

    return ReportOutputMapper.toOutput(report, pet, user, reportImages);
}
}