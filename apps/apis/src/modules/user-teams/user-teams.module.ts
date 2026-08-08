import { Module } from "@nestjs/common";

import { SeasonsModule } from "../seasons/seasons.module";

import { CreateUserTeamUseCase } from "./application/use-cases/create-user-team.use-case";
import { GetMyUserTeamUseCase } from "./application/use-cases/get-my-user-team.use-case";
import { GetUserTeamByIdUseCase } from "./application/use-cases/get-user-team-by-id.use-case";

import { PrismaUserTeamRepository } from "./infrastructure/repositories/prisma-user-team.repository";

import { USER_TEAM_REPOSITORY } from "./domain/repositories/user-team.repository";
import { UserTeamsController } from "./presentation/controllers/user-teams.controller";

@Module({
  imports: [SeasonsModule],

  controllers: [UserTeamsController],

  providers: [
    CreateUserTeamUseCase,
    GetMyUserTeamUseCase,
    GetUserTeamByIdUseCase,

    {
      provide: USER_TEAM_REPOSITORY,
      useClass: PrismaUserTeamRepository,
    },
  ],

  exports: [
    CreateUserTeamUseCase,
    GetMyUserTeamUseCase,
    GetUserTeamByIdUseCase,
  ],
})
export class UserTeamsModule {}
