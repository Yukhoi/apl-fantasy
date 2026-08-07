import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  PLAYER_REPOSITORY,
  PlayerRepository,
} from '../../domain/repositories/player.repository'
import { PlayerResponseDto } from '../dto/player-response.dto'

@Injectable()
export class GetPlayerByIdUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY)
    private readonly playerRepository: PlayerRepository,
  ) {}

  async execute(playerId: string): Promise<PlayerResponseDto> {
    const player = await this.playerRepository.findById(playerId)

    if (!player) {
      throw new NotFoundException(`Player with id "${playerId}" not found`)
    }

    return {
      playerId: player.playerId,
      name: player.name,
      clubId: player.clubId,
      position: player.position,
      status: player.status,
      currentPrice: player.currentPrice.toString(),
      club: player.club
        ? {
            clubId: player.club.clubId,
            name: player.club.name,
            shortName: player.club.shortName,
          }
        : null,
    }
  }
}