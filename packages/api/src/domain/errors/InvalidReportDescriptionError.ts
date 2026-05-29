export class InvalidReportDescriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidReportDescriptionError";
  }
}
