import { describe, it, expect } from "vitest";
import { updateStatusReportSchema } from "../update-status-report.schema";

describe("updateStatusReportSchema", () => {
  it("debería validar con éxito un publicId UUID y status correcto", () => {
    const input = {
      params: {
        publicId: "42f76776-5029-491f-b0ad-e932fca1f951",
      },
      body: {
        status: "resolved",
      },
    };

    const result = updateStatusReportSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.params.publicId).toBe("42f76776-5029-491f-b0ad-e932fca1f951");
      expect(result.data.body.status).toBe("RESOLVED");
    }
  });

  it("debería fallar si el publicId no es un UUID válido", () => {
    const input = {
      params: {
        publicId: "non-existent-uuid",
      },
      body: {
        status: "CLOSED",
      },
    };

    const result = updateStatusReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("debería fallar si el status no es válido", () => {
    const input = {
      params: {
        publicId: "42f76776-5029-491f-b0ad-e932fca1f951",
      },
      body: {
        status: "EXPIRED",
      },
    };

    const result = updateStatusReportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
