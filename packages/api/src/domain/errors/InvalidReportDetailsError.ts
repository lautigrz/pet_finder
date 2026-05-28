export class InvalidReportDetailsError extends Error {
  constructor(type: string, expectedClass: string) {
    super(`Report of type "${type}" requires ${expectedClass}`);
    this.name = "InvalidReportDetailsError";
  }
}
