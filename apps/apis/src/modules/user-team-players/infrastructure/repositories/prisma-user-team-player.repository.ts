import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import { UserTeamPlayerEntity } from "../../domain/entities/user-team-player.entity";
import {
  CreateUserTeamPlayerData,
  UserTeamPlayerRepository,
} from "../../domain/repositories/user-team-player.repository";
import {
  SquadPlayerClubEntity,
  SquadPlayerEntity,
} from "../../domain/entities/squad-player.entity";
import { Prisma } from "@prisma/client";

@Injectable()
export class PrismaUserTeamPlayerRepository implements UserTeamPlayerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByUserTeamId(
    userTeamId: string,
  ): Promise<UserTeamPlayerEntity[]> {
    const entries = await this.prisma.userTeamPlayer.findMany({
      where: {
        userTeamId,
        isActive: true,
      },
      include: {
        player: {
          include: {
            club: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    return entries.map(
      (entry) =>
        new UserTeamPlayerEntity(
          entry.userTeamPlayerId,
          entry.userTeamId,
          entry.playerId,
          entry.purchasePrice,
          entry.isActive,
          entry.joinedAt,
          entry.leftAt,

          new SquadPlayerEntity(
            entry.player.playerId,
            entry.player.name,
            entry.player.clubId,
            entry.player.position,
            entry.player.status,
            entry.player.currentPrice,

            new SquadPlayerClubEntity(
              entry.player.club.clubId,
              entry.player.club.name,
              entry.player.club.shortName ?? null,
            ),
          ),
        ),
    );
  }

  async createMany(
    players: CreateUserTeamPlayerData[],
  ): Promise<UserTeamPlayerEntity[]> {
    const entries = await this.prisma.$transaction(
      players.map((player) =>
        this.prisma.userTeamPlayer.create({
          data: {
            userTeamId: player.userTeamId,
            playerId: player.playerId,
            purchasePrice: player.purchasePrice,
          },
        }),
      ),
    );

    return entries.map(
      (entry) =>
        new UserTeamPlayerEntity(
          entry.userTeamPlayerId,
          entry.userTeamId,
          entry.playerId,
          entry.purchasePrice,
          entry.isActive,
          entry.joinedAt,
          entry.leftAt,
        ),
    );
  }

  async createInitialSquadWithBudgetUpdate(
    players: CreateUserTeamPlayerData[],
    userTeamId: string,
    budgetBalance: Prisma.Decimal,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.userTeamPlayer.createMany({
        data: players,
      });

      await tx.userTeam.update({
        where: {
          userTeamId,
        },
        data: {
          budgetBalance,
        },
      });
    });
  }
}
