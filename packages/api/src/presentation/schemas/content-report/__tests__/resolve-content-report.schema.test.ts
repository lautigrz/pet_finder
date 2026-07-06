import { describe, it, expect } from "vitest";
import { resolveContentReportRequestSchema } from "../content-report.schema";

const VALID_UUID = "42f76776-5029-491f-b0ad-e932fca1f951";

describe("resolveContentReportRequestSchema", () => {
  it("valida aprobar (REVIEWED) con publicId UUID", () => {
    const result = resolveContentReportRequestSchema.safeParse({
      params: { publicId: VALID_UUID },
      body: { status: "REVIEWED" },
    });

    expect(result.success).toBe(true);
  });

  it("valida suspender con motivo", () => {
    const result = resolveContentReportRequestSchema.safeParse({
      params: { publicId: VALID_UUID },
      body: { status: "SUSPENDED", suspensionReason: "Contenido fraudulento" },
    });

    expect(result.success).toBe(true);
  });

  it("falla al suspender sin motivo", () => {
    const result = resolveContentReportRequestSchema.safeParse({
      params: { publicId: VALID_UUID },
      body: { status: "SUSPENDED" },
    });

    expect(result.success).toBe(false);
  });

  it("valida revertir a PENDING", () => {
    const result = resolveContentReportRequestSchema.safeParse({
      params: { publicId: VALID_UUID },
      body: { status: "PENDING" },
    });

    expect(result.success).toBe(true);
  });

  it("falla con un estado inválido", () => {
    const result = resolveContentReportRequestSchema.safeParse({
      params: { publicId: VALID_UUID },
      body: { status: "EXPIRED" },
    });

    expect(result.success).toBe(false);
  });

  it("falla si el publicId no es un UUID válido", () => {
    const result = resolveContentReportRequestSchema.safeParse({
      params: { publicId: "no-uuid" },
      body: { status: "REVIEWED" },
    });

    expect(result.success).toBe(false);
  });
});
