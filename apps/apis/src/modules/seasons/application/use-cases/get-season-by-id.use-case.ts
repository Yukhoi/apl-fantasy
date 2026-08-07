import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  SEASON_REPOSITORY,
  SeasonRepository,
} from "../../domain/repositories/season.repository";
import { SeasonResponseDto } from "../dto/season-response.dto";

@Injectable()
export class GetSeasonByIdUseCase {
  constructor(
    @Inject(SEASON_REPOSITORY)
    private readonly seasonRepository: SeasonRepository,
  ) {}

  async execute(seasonId: string): Promise<SeasonResponseDto> {
    const season = await this.seasonRepository.findById(seasonId);

    if (!season) {
      throw new NotFoundException("Season not found");
    }

    return {
      seasonId: season.seasonId,
      name: season.name,
      startDate: season.startDate.toISOString(),
      endDate: season.endDate.toISOString(),
      status: season.status,
    };
  }
}
