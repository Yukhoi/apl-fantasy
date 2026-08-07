import { Inject, Injectable } from "@nestjs/common";
import {
  SEASON_REPOSITORY,
  SeasonRepository,
} from "../../domain/repositories/season.repository";
import { SeasonResponseDto } from "../dto/season-response.dto";

@Injectable()
export class GetAllSeasonsUseCase {
  constructor(
    @Inject(SEASON_REPOSITORY)
    private readonly seasonRepository: SeasonRepository,
  ) {}

  async execute(): Promise<SeasonResponseDto[]> {
    const seasons = await this.seasonRepository.findAll();

    return seasons.map(
      (s) =>
        ({
          seasonId: s.seasonId,
          name: s.name,
          startDate: s.startDate.toISOString(),
          endDate: s.endDate.toISOString(),
          status: s.status,
        }),
    );
  }
}
