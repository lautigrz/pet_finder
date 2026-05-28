export class InvalidStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition from "${from}" to "${to}"`);
    this.name = "InvalidStatusTransitionError";
  }
}
