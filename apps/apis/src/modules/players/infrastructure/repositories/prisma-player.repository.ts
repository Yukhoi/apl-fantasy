import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { ClubSummaryEntity } from "../../domain/entities/club-summary.entity";
import { PlayerEntity } from "../../domain/entities/player.entity";
import {
  FindPlayersOptions,
  PaginatedPlayersResult,
  PlayerRepository,
} from "../../domain/repositories/player.repository";

@Injectable()
export class PrismaPlayerRepository implements PlayerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(options: FindPlayersOptions): Promise<PaginatedPlayersResult> {
    const { filters, page, limit, sortBy, order } = options;

    const where: Prisma.PlayerWhereInput = {
      ...(filters?.clubId ? { clubId: filters.clubId } : {}),
      ...(filters?.position ? { position: filters.position } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.name
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive",
            },
          }
        : {}),
    };

    const orderBy = this.buildOrderBy(sortBy, order);
    const skip = (page - 1) * limit;

    const [players, total] = await this.prisma.$transaction([
      this.prisma.player.findMany({
        where,
        include: {
          club: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.player.count({ where }),
    ]);

    return {
      data: players.map(
        (player) =>
          new PlayerEntity(
            player.playerId,
            player.name,
            player.clubId,
            player.position,
            player.status,
            player.currentPrice,
            player.club
              ? new ClubSummaryEntity(
                  player.club.clubId,
                  player.club.name,
                  player.club.shortName ?? null,
                )
              : undefined,
          ),
      ),
      total,
      page,
      limit,
    };
  }

  async findById(playerId: string): Promise<PlayerEntity | null> {
    const player = await this.prisma.player.findUnique({
      where: {
        playerId,
      },
      include: {
        club: true,
      },
    });

    if (!player) {
      return null;
    }

    return new PlayerEntity(
      player.playerId,
      player.name,
      player.clubId,
      player.position,
      player.status,
      player.currentPrice,
      player.club
        ? new ClubSummaryEntity(
            player.club.clubId,
            player.club.name,
            player.club.shortName ?? null,
          )
        : undefined,
    );
  }

  async findByIds(playerIds: string[]): Promise<PlayerEntity[]> {
    const players = await this.prisma.player.findMany({
      where: {
        playerId: {
          in: playerIds,
        },
      },
      include: {
        club: true,
      },
    });

    return players.map(
      (player) =>
        new PlayerEntity(
          player.playerId,
          player.name,
          player.clubId,
          player.position,
          player.status,
          player.currentPrice,
          player.club
            ? new ClubSummaryEntity(
                player.club.clubId,
                player.club.name,
                player.club.shortName ?? null,
              )
            : undefined,
        ),
    );
  }

  private buildOrderBy(
    sortBy: string,
    order: "asc" | "desc",
  ): Prisma.PlayerOrderByWithRelationInput[] {
    switch (sortBy) {
      case "currentPrice":
        return [{ currentPrice: order }, { name: "asc" }];

      case "position":
        return [{ position: order }, { name: "asc" }];

      case "status":
        return [{ status: order }, { name: "asc" }];

      case "name":
      default:
        return [{ name: order }];
    }
  }
}
