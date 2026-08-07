import { Module } from "@nestjs/common";
import { GameweeksController } from "./presentation/controllers/gameweeks.controller";
import { GetAllGameweeksUseCase } from "./application/use-cases/get-all-gameweeks.use-case";
import { GetGameweekByIdUseCase } from "./application/use-cases/get-gameweek-by-id.use-case";
import { GAMEWEEK_REPOSITORY } from "./domain/repositories/gameweek.repository";
import { PrismaGameweekRepository } from "./infrastructure/repositories/prisma-gameweek.repository";

@Module({
  controllers: [GameweeksController],
  providers: [
    GetAllGameweeksUseCase,
    GetGameweekByIdUseCase,
    {
      provide: GAMEWEEK_REPOSITORY,
      useClass: PrismaGameweekRepository,
    },
  ],
})
export class GameweeksModule {}
