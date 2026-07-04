import { describe, it, expect } from "vitest";
import { Report } from "../ReportAggregate";
import { ReportType } from "../../types/report.type";
import { ReportStatus } from "../../types/report.status";
import { Location } from "../../value-objects/location.vo";
import { LostReportDetails } from "../../value-objects/lost-report-details.vo";
import { InvalidStatusTransitionError } from "../../../errors/InvalidStatusTransitionError";

function restore(currentStatus: ReportStatus, closedByModeration = false): Report {
  return Report.restore({
    idReport: 1,
    publicId: "p",
    userId: 5,
    userPublicId: "u",
    type: ReportType.LOST,
    currentStatus,
    description: null,
    details: LostReportDetails.create({ petId: 10 }),
    location: Location.create({ address: "Calle 1", latitude: -34.6, longitude: -58.4 }),
    occurredAt: new Date("2026-06-20"),
    createdAt: new Date("2026-06-20"),
    updatedAt: null,
    closedByModeration,
  });
}

describe("Report reopen / closedByModeration", () => {
  it("suspend cierra el reporte y lo marca como cerrado por moderación", () => {
    const report = restore(ReportStatus.ACTIVE);

    report.suspend();

    expect(report.status).toBe(ReportStatus.CLOSED);
    expect(report.closedByModeration).toBe(true);
  });

  it("reopen reabre un reporte cerrado y limpia el flag de moderación", () => {
    const report = restore(ReportStatus.CLOSED, true);

    report.reopen();

    expect(report.status).toBe(ReportStatus.ACTIVE);
    expect(report.closedByModeration).toBe(false);
  });

  it("reopen sobre un reporte activo lanza InvalidStatusTransitionError", () => {
    const report = restore(ReportStatus.ACTIVE);

    expect(() => report.reopen()).toThrow(InvalidStatusTransitionError);
  });
});
