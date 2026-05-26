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
      throw new Error('Description cannot be empty')
    }

    if (this.value.length > 1000) {
      throw new Error('Description too long')
    }
  }
}