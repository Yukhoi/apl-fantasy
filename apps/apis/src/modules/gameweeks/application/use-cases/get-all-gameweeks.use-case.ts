import { Inject, Injectable } from '@nestjs/common'
import {
  FindGameweeksFilters,
  GAMEWEEK_REPOSITORY,
  GameweekRepository,
} from '../../domain/repositories/gameweek.repository'
import { GameweekResponseDto } from '../dto/gameweek-response.dto'

@Injectable()
export class GetAllGameweeksUseCase {
  constructor(
    @Inject(GAMEWEEK_REPOSITORY)
    private readonly gameweekRepository: GameweekRepository,
  ) {}

  async execute(
    filters?: FindGameweeksFilters,
  ): Promise<GameweekResponseDto[]> {
    const gameweeks = await this.gameweekRepository.findAll(filters)

    return gameweeks.map((gameweek) => ({
      gameweekId: gameweek.gameweekId,
      seasonId: gameweek.seasonId,
      gwNumber: gameweek.gwNumber,
      date: gameweek.date.toISOString(),
    }))
  }
}