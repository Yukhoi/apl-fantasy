import { Inject, Injectable } from '@nestjs/common'
import {
  PLAYER_REPOSITORY,
  PlayerRepository,
} from '../../domain/repositories/player.repository'
import { GetPlayersQueryDto } from '../dto/get-players-query.dto'
import { PaginatedPlayersResponseDto } from '../dto/paginated-players-response.dto'

@Injectable()
export class GetAllPlayersUseCase {
  constructor(
    @Inject(PLAYER_REPOSITORY)
    private readonly playerRepository: PlayerRepository,
  ) {}

  async execute(query: GetPlayersQueryDto): Promise<PaginatedPlayersResponseDto> {
    const result = await this.playerRepository.findAll({
      filters: {
        clubId: query.clubId,
        position: query.position,
        status: query.status,
        name: query.name || undefined,
      },
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      order: query.order,
    })

    return {
      data: result.data.map((player) => ({
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
      })),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    }
  }
}