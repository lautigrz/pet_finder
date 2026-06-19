import { Report } from "../aggregates/ReportAggregate";
import { ReportQuery } from "@application/usecase/report-usecase/report-query";
import { Pet } from "@domain/pet/aggregates/PetAggregate";
import { SightingImage } from "../value-objects/sighting.images";

export type ReportWithPet = { report: Report; pet?: Pet }
export type ReportWithPetDetail = { report: Report; pet: Pet }
export interface ReportRepository {

  save(report: Report, images?: SightingImage[]): Promise<number>;

  findByPublicId(publicId: string): Promise<Report | null>

  findDetailByPublicId(publicId: string): Promise<ReportWithPet | null>

  findByUserPublicId(userPublicId: string, filters?: { reportType?: string; animalType?: string; createdFrom?: string; createdTo?: string; q?: string; }): Promise<Report[]>

  findIdsByQuery(query: ReportQuery): Promise<string[]>

  findByIds(ids: string[]): Promise<ReportWithPet[]>;

  findDetailsByIds(ids: number[]): Promise<ReportWithPetDetail[]>;

  update(report: Report): Promise<void>;

  findImagesByReportId(publicId: string): Promise<SightingImage[]>;
  updateFields(report: Report, images?: SightingImage[]): Promise<void>;
}