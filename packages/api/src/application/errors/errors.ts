
export class MissingFieldError extends Error {
  constructor(field: string) {
    super(`Missing required field: ${field}`)
    this.name = 'MissingFieldError'
  }
}

export class InvalidReportTypeError extends Error {
  constructor(type: string) {
    super(`Unknown report type: ${type}`)
    this.name = 'InvalidReportTypeError'
  }
}

export class InvalidFieldError extends Error {
    constructor(field: string, message: string) {
      super(`Invalid field "${field}": ${message}`)
      this.name = 'InvalidFieldError'   
    }
}

export class MappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MappingError';
  }
}