import { Module } from '@nestjs/common'
import { PlayersController } from './presentation/controllers/players.controller'
import { GetAllPlayersUseCase } from './application/use-cases/get-all-players.use-case'
import { GetPlayerByIdUseCase } from './application/use-cases/get-player-by-id.use-case'
import { PLAYER_REPOSITORY } from './domain/repositories/player.repository'
import { PrismaPlayerRepository } from './infrastructure/repositories/prisma-player.repository'

@Module({
  controllers: [PlayersController],
  providers: [
    GetAllPlayersUseCase,
    GetPlayerByIdUseCase,
    {
      provide: PLAYER_REPOSITORY,
      useClass: PrismaPlayerRepository,
    },
  ],
})
export class PlayersModule {}