import { Module } from "@nestjs/common";

import { UserTeamsModule } from "../user-teams/user-teams.module";
import { PlayersModule } from "../players/players.module";

import { CreateInitialSquadUseCase } from "./application/use-cases/create-initial-squad.use-case";
import { GetUserTeamPlayersUseCase } from "./application/use-cases/get-user-team-players.use-case";

import { USER_TEAM_PLAYER_REPOSITORY } from "./domain/repositories/user-team-player.repository";
import { PrismaUserTeamPlayerRepository } from "./infrastructure/repositories/prisma-user-team-player.repository";

import { UserTeamPlayersController } from "./presentation/controllers/user-team-players.controller";

@Module({
  imports: [
    UserTeamsModule,
    PlayersModule,
  ],
  controllers: [
    UserTeamPlayersController,
  ],
  providers: [
    CreateInitialSquadUseCase,
    GetUserTeamPlayersUseCase,
    {
      provide: USER_TEAM_PLAYER_REPOSITORY,
      useClass: PrismaUserTeamPlayerRepository,
    },
  ],
})
export class UserTeamPlayersModule {}