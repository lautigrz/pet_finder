export class ReportNotFoundError extends Error {
  constructor(publicId: string) {
    super(`Report not found with publicId: ${publicId}`);
    this.name = "ReportNotFoundError";
  }
}
