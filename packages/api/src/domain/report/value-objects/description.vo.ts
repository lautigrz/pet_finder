import { InvalidReportDescriptionError } from "../../errors/InvalidReportDescriptionError";

export class ReportDescription {
  constructor(
    public readonly value: string,
  ) {
    this.validate()
  }

  static create(value: string): ReportDescription {
    return new ReportDescription(value)
  }

  private validate(): void {
    if (!this.value.trim()) {
      throw new InvalidReportDescriptionError('Description cannot be empty')
    }

    if (this.value.length > 1000) {
      throw new InvalidReportDescriptionError('Description too long')
    }
  }
}