import { DomainError } from "./DomainError";

export class ReportClosedError extends DomainError {
    constructor(publicId: string) {
        super(`Report is closed`, "REPORT_CLOSED");
    }
}
