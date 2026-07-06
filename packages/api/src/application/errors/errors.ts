
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

export { InvalidFieldError } from '../../domain/errors/InvalidFieldError';

export class MappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MappingError';
  }
}