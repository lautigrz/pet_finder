import { describe, it, expect } from "vitest";
import { GetAdminStatsUseCase } from "../get-admin-stats.usecase";
import { AdminStatsRepository } from "@domain/stats/repositories/admin-stats.repository";

function makeRepo(overrides: Partial<AdminStatsRepository> = {}): AdminStatsRepository {
  return {
    reportsByMonth: async () => [],
    reunionCounts: async () => ({ total: 0, reunited: 0 }),
    averageResolutionDays: async () => null,
    ...overrides,
  };
}

describe("GetAdminStatsUseCase", () => {
  it("devuelve siempre 12 meses, rellenando los faltantes con 0", async () => {
    const useCase = new GetAdminStatsUseCase(makeRepo());

    const result = await useCase.execute();

    expect(result.reportsByMonth).toHaveLength(12);
    expect(result.reportsByMonth.every((m) => m.lost === 0 && m.sighting === 0)).toBe(true);
  });

  it("calcula la tasa de reuniones como porcentaje", async () => {
    const useCase = new GetAdminStatsUseCase(
      makeRepo({ reunionCounts: async () => ({ total: 8, reunited: 2 }) }),
    );

    const result = await useCase.execute();

    expect(result.reunionRate).toEqual({ total: 8, reunited: 2, rate: 25 });
  });

  it("devuelve tasa 0 cuando no hay reportes (evita dividir por cero)", async () => {
    const useCase = new GetAdminStatsUseCase(
      makeRepo({ reunionCounts: async () => ({ total: 0, reunited: 0 }) }),
    );

    const result = await useCase.execute();

    expect(result.reunionRate.rate).toBe(0);
  });

  it("redondea el promedio de días a un decimal y respeta el null", async () => {
    const conPromedio = new GetAdminStatsUseCase(
      makeRepo({ averageResolutionDays: async () => 5.4567 }),
    );
    expect((await conPromedio.execute()).avgResolutionDays).toBe(5.5);

    const sinPromedio = new GetAdminStatsUseCase(
      makeRepo({ averageResolutionDays: async () => null }),
    );
    expect((await sinPromedio.execute()).avgResolutionDays).toBeNull();
  });

  it("conserva los datos reales de un mes dentro del rango", async () => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const useCase = new GetAdminStatsUseCase(
      makeRepo({ reportsByMonth: async () => [{ month: key, lost: 5, sighting: 3 }] }),
    );

    const result = await useCase.execute();

    expect(result.reportsByMonth.find((m) => m.month === key)).toEqual({
      month: key,
      lost: 5,
      sighting: 3,
    });
  });
});
