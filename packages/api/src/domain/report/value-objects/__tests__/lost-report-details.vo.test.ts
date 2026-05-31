import { describe, it, expect } from "vitest";
import { LostReportDetails } from "../lost-report-details.vo";

describe("LostReportDetails", () => {
  describe("create", () => {
    it("crea LostReportDetails con el petId correcto", () => {
      const details = LostReportDetails.create({ petId: 42 });

      expect(details.petId).toBe(42);
    });

    it("acepta petId igual a 1 (mínimo entero positivo)", () => {
      const details = LostReportDetails.create({ petId: 1 });
      expect(details.petId).toBe(1);
    });

    it("preserva petId grande correctamente", () => {
      const details = LostReportDetails.create({ petId: 999999 });
      expect(details.petId).toBe(999999);
    });
  });
});
