import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import { SeasonEntity } from "../../domain/entities/season.entity";
import { SeasonRepository } from "../../domain/repositories/season.repository";
import { SeasonStatus } from "@prisma/client";

@Injectable()
export class PrismaSeasonRepository implements SeasonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SeasonEntity[]> {
    const seasons = await this.prisma.season.findMany({
      orderBy: [{ startDate: "desc" }],
    });

    return seasons.map(
      (s) =>
        new SeasonEntity(
          s.seasonId,
          s.name,
          s.startDate,
          s.endDate,
          s.status as SeasonStatus,
        ),
    );
  }

  async findById(seasonId: string): Promise<SeasonEntity | null> {
    const s = await this.prisma.season.findUnique({
      where: { seasonId },
    });

    if (!s) return null;

    return new SeasonEntity(
      s.seasonId,
      s.name,
      s.startDate,
      s.endDate,
      s.status,
    );
  }

  async findCurrent(): Promise<SeasonEntity | null> {
    const s = await this.prisma.season.findFirst({
      where: {
        status: SeasonStatus.Active,
      },
    });

    if (!s) return null;

    return new SeasonEntity(
      s.seasonId,
      s.name,
      s.startDate,
      s.endDate,
      s.status,
    );
  }
}
