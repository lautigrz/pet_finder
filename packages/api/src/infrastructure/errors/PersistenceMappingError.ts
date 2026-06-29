import { ApplicationError } from "./ApplicationError";

export class PersistenceMappingError extends ApplicationError {
  constructor(message: string, code: string = "PERSISTENCE_MAPPING_ERROR") {
    super(message, code);
    this.name = "PersistenceMappingError";
  }
}
