import { Report } from "../aggregates/ReportAggregate";
import { Page, PaginationParams } from "../../shared/pagination/pagination";
import { ReportQuery } from "@application/usecase/report/report-query";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { ReportStatus } from "../types/report.status";

export type ReportWithPet = { report: Report; pet?: Pet }

export interface ReportRepository {
  save(report: Report): Promise<void>

  findByPublicId(publicId: string): Promise<Report | null>

  findDetailByPublicId(publicId: string): Promise<ReportWithPet | null>

  findByUserPublicId(userPublicId: string, pagination: PaginationParams): Promise<Page<Report>>

  findIdsByQuery(query: ReportQuery): Promise<string[]>

  findByIds(ids: string[]): Promise<ReportWithPet[]>;

  update(report: Report): Promise<void>;

}