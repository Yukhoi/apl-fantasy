import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  GAMEWEEK_REPOSITORY,
  GameweekRepository,
} from "../../domain/repositories/gameweek.repository";
import { GameweekResponseDto } from "../dto/gameweek-response.dto";

@Injectable()
export class GetGameweekByIdUseCase {
  constructor(
    @Inject(GAMEWEEK_REPOSITORY)
    private readonly gameweekRepository: GameweekRepository,
  ) {}

  async execute(gameweekId: string): Promise<GameweekResponseDto> {
    const gameweek = await this.gameweekRepository.findById(gameweekId);

    if (!gameweek) {
      throw new NotFoundException(`Gameweek with id "${gameweekId}" not found`);
    }

    return {
      gameweekId: gameweek.gameweekId,
      seasonId: gameweek.seasonId,
      gwNumber: gameweek.gwNumber,
      date: gameweek.date.toISOString(),
    };
  }
}
