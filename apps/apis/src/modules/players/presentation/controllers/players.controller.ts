import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common'
import { GetAllPlayersUseCase } from '../../application/use-cases/get-all-players.use-case'
import { GetPlayerByIdUseCase } from '../../application/use-cases/get-player-by-id.use-case'
import { GetPlayersQueryDto } from '../../application/dto/get-players-query.dto'
import { PaginatedPlayersResponseDto } from '../../application/dto/paginated-players-response.dto'
import { PlayerResponseDto } from '../../application/dto/player-response.dto'

@Controller('players')
export class PlayersController {
  constructor(
    private readonly getAllPlayersUseCase: GetAllPlayersUseCase,
    private readonly getPlayerByIdUseCase: GetPlayerByIdUseCase,
  ) {}

  @Get()
  async findAll(
    @Query() query: GetPlayersQueryDto,
  ): Promise<PaginatedPlayersResponseDto> {
    return this.getAllPlayersUseCase.execute(query)
  }

  @Get(':playerId')
  async findById(
    @Param('playerId', new ParseUUIDPipe()) playerId: string,
  ): Promise<PlayerResponseDto> {
    return this.getPlayerByIdUseCase.execute(playerId)
  }
}