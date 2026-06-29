
export interface MatchResultRaw {
    source_report_id: number;
    candidate_report_id: number;
    score: number;
}
export interface IMatchRepository {

    findMatchResults(sourceReportId: number): Promise<MatchResultRaw[]>;

}