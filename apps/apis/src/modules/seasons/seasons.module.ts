import { Module } from "@nestjs/common";
import { SeasonsController } from "./presentation/controllers/seasons.controller";
import { GetAllSeasonsUseCase } from "./application/use-cases/get-all-seasons.use-case";
import { GetSeasonByIdUseCase } from "./application/use-cases/get-season-by-id.use-case";
import { GetCurrentSeasonUseCase } from "./application/use-cases/get-current-season.use-case";
import { SEASON_REPOSITORY } from "./domain/repositories/season.repository";
import { PrismaSeasonRepository } from "./infrastructure/repositories/prisma-season.repository";

@Module({
  controllers: [SeasonsController],
  providers: [
    GetAllSeasonsUseCase,
    GetSeasonByIdUseCase,
    GetCurrentSeasonUseCase,
    {
      provide: SEASON_REPOSITORY,
      useClass: PrismaSeasonRepository,
    },
  ],
  exports: [GetSeasonByIdUseCase, GetCurrentSeasonUseCase],
})
export class SeasonsModule {}
