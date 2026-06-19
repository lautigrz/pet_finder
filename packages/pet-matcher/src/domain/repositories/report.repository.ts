import { DetailsReport, LocationReport, ReportEntity } from '@domain/entities/report.entity';
import { MatchResult } from '@domain/entities/match-result.entity';

export interface IReportRepository {
  findById(reportId: number): Promise<ReportEntity | null>;

  findCandidatesReportsActives(reportId: number, details: DetailsReport, location: LocationReport): Promise<ReportEntity[]>;

  updateDescriptionEmbedding(reportId: number, embedding: number[]): Promise<void>;

  updateImageEmbedding(imageId: number, embedding: number[]): Promise<void>;

  saveMatchResults(sourceReportId: number, results: MatchResult[]): Promise<void>;
}

