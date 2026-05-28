export class PersistenceMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistenceMappingError";
  }
}
