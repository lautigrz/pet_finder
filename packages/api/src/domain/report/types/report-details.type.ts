import { LostReportDetails } from "../value-objects/lost-report-details.vo";
import { SightingReportDetails } from "../value-objects/sighting-report-details.vo";

export type ReportDetails =
  | LostReportDetails
  | SightingReportDetails