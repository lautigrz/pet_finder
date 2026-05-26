import { Report } from "../aggregates/report.aggregate";


export interface ReportRepository {
  save(report: Report): Promise<void>

  findByPublicId(publicId: string): Promise<Report | null>
}