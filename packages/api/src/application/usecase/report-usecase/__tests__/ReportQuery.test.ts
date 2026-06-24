import { describe, it, expect } from "vitest";
import { ReportQuery } from "../report-query";
import { ReportType } from "@domain/report/types/report.type";
import { ReportStatus } from "@domain/report/types/report.status";
import { AnimalType } from "@domain/shared/animal-type/animal-type";

describe("ReportQuery", () => {
  it("debería instanciar correctamente con todos los parámetros válidos", () => {
    const dto = {
      reportType: ReportType.LOST,
      animalType: AnimalType.DOG,
      status: ReportStatus.ACTIVE,
      createdFrom: "2024-05-01",
      createdTo: "2024-05-10",
      q: "  perro marrón  ",
    };

    const query = new ReportQuery(dto);

    expect(query.reportType).toBe(ReportType.LOST);
    expect(query.animalType).toBe(AnimalType.DOG);
    expect(query.status).toBe(ReportStatus.ACTIVE);
    expect(query.createdFrom).toEqual(
      new Date("2024-05-01T00:00:00.000-03:00"),
    );
    expect(query.createdTo).toEqual(
      new Date("2024-05-10T23:59:59.999-03:00"),
    );
    expect(query.q).toBe("perro marrón");
  });

  it("debería dejar campos como undefined si no se proveen en el DTO", () => {
    const dto = {};
    const query = new ReportQuery(dto);

    expect(query.reportType).toBeUndefined();
    expect(query.animalType).toBeUndefined();
    expect(query.status).toBeUndefined();
    expect(query.createdFrom).toBeUndefined();
    expect(query.createdTo).toBeUndefined();
    expect(query.q).toBeUndefined();
  });

  it("debería convertir una búsqueda vacía o con espacios en undefined", () => {
    const query = new ReportQuery({
      q: "   ",
    });

    expect(query.q).toBeUndefined();
  });

  it("debería normalizar correctamente las fechas createdFrom y createdTo", () => {
    const dto = {
      createdFrom: "2026-06-01",
      createdTo: "2026-06-01",
    };

    const query = new ReportQuery(dto);

    expect(query.createdFrom?.toISOString()).toBe("2026-06-01T03:00:00.000Z");
    expect(query.createdTo?.toISOString()).toBe("2026-06-02T02:59:59.999Z");
  });

  it("debería lanzar un error si reportType no es válido", () => {
    const dto = {
      reportType: "INVALID_TYPE",
    };

    expect(() => new ReportQuery(dto)).toThrow("ReportType inválido: INVALID_TYPE");
  });

  it("debería lanzar un error si animalType no es válido", () => {
    const dto = {
      animalType: "INVALID_ANIMAL",
    };

    expect(() => new ReportQuery(dto)).toThrow("AnimalType inválido: INVALID_ANIMAL");
  });

  it("debería lanzar un error si status no es válido", () => {
    const dto = {
      status: "INVALID_STATUS",
    };

    expect(() => new ReportQuery(dto)).toThrow("ReportStatus inválido: INVALID_STATUS");
  });

  describe("requiresPetJoin", () => {
    it("debería retornar true si animalType está definido", () => {
      const query = new ReportQuery({ animalType: AnimalType.CAT });
      expect(query.requiresPetJoin).toBe(true);
    });

    it("debería retornar false si animalType no está definido", () => {
      const query = new ReportQuery({ reportType: ReportType.LOST });
      expect(query.requiresPetJoin).toBe(false);
    });
  });
});
