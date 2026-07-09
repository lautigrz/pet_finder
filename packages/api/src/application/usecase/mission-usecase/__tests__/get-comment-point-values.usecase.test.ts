import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetCommentPointValuesUseCase } from "../get-comment-point-values.usecase";
import { PointValue } from "@domain/mission/value-objects/point-value.vo";


const typeLabel = {
  BASICO: "Basico",
  BUENO: "Bueno",
  EXCELENTE: "Excelente"
}


describe("GetCommentPointValuesUseCase Unit Tests", () => {
  let mockMissionUpdateRepository: any;

  beforeEach(() => {
    mockMissionUpdateRepository = {
      findPointByContext: vi.fn()
    };
  });

  it("should fetch point values for COMMENT context successfully", async () => {
    const usecase = new GetCommentPointValuesUseCase(mockMissionUpdateRepository);

    const mockPoints = [
      PointValue.create({ points: 25, label: typeLabel.BUENO }),
      PointValue.create({ points: 10, label: typeLabel.BASICO }),
      PointValue.create({ points: 50, label: typeLabel.EXCELENTE })
    ];

    mockMissionUpdateRepository.findPointByContext.mockResolvedValue(mockPoints);

    const result = await usecase.execute();

    expect(result.length).toBe(3);
    expect(result[0]!.points).toBe(10);
    expect(result[0]!.label).toBe(typeLabel.BASICO);
    expect(result[1]!.points).toBe(25);
    expect(result[1]!.label).toBe(typeLabel.BUENO);
    expect(result[2]!.points).toBe(50);
    expect(result[2]!.label).toBe(typeLabel.EXCELENTE);
  });
});
