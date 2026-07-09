import { inject, injectable } from "tsyringe";
import type { MissionUpdateRepository } from "@domain/mission/repositories/mission-update.repository";

export interface CommentPointValueOutput {
  points: number;
  label: string;
}

@injectable()
export class GetCommentPointValuesUseCase {
  constructor(
    @inject("MissionUpdateRepository")
    private readonly updateRepository: MissionUpdateRepository
  ) { }

  async execute(): Promise<CommentPointValueOutput[]> {
    const points = await this.updateRepository.findPointByContext("COMMENT");
    
    return points.map(p => ({
      points: p.points,
      label: p.label
    })).sort((a, b) => a.points - b.points);
  }
}
