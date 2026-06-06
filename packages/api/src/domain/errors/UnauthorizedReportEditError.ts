export class UnauthorizedReportEditError extends Error {
  constructor() {
    super('You are not authorized to edit this report');
    this.name = 'UnauthorizedReportEditError';
  }
}