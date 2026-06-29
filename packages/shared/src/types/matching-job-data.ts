import { DataChangeType, TypeJob } from "../index";

export type MatchingJobData = { type: TypeJob; reportId: number; reportType: number; reportTypeName: string, changes?: DataChangeType[] }