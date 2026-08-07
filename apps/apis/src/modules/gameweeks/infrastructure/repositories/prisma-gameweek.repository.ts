import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import { GameweekEntity } from "../../domain/entities/gameweek.entity";
import {
  FindGameweeksFilters,
  GameweekRepository,
} from "../../domain/repositories/gameweek.repository";

@Injectable()
export class PrismaGameweekRepository implements GameweekRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: FindGameweeksFilters): Promise<GameweekEntity[]> {
    const gameweeks = await this.prisma.gameweek.findMany({
      where: {
        seasonId: filters?.seasonId,
        gwNumber: filters?.gwNumber,
      },
      orderBy: [{ gwNumber: "asc" }],
    });

    return gameweeks.map(
      (gameweek) =>
        new GameweekEntity(
          gameweek.gameweekId,
          gameweek.seasonId,
          gameweek.gwNumber,
          gameweek.startsAt,
        ),
    );
  }

  async findById(gameweekId: string): Promise<GameweekEntity | null> {
    const gameweek = await this.prisma.gameweek.findUnique({
      where: {
        gameweekId,
      },
    });

    if (!gameweek) {
      return null;
    }

    return new GameweekEntity(
      gameweek.gameweekId,
      gameweek.seasonId,
      gameweek.gwNumber,
      gameweek.startsAt,
    );
  }
}
