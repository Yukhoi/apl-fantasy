import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../prisma/prisma.service";
import { UserTeamEntity } from "../../domain/entities/user-team.entity";
import {
  CreateUserTeamData,
  UserTeamRepository,
} from "../../domain/repositories/user-team.repository";

@Injectable()
export class PrismaUserTeamRepository implements UserTeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userTeamId: string): Promise<UserTeamEntity | null> {
    const userTeam = await this.prisma.userTeam.findUnique({
      where: {
        userTeamId,
      },
    });

    if (!userTeam) {
      return null;
    }

    return new UserTeamEntity(
      userTeam.userTeamId,
      userTeam.userId,
      userTeam.seasonId,
      userTeam.teamName,
      userTeam.budgetLimit,
      userTeam.totalPoints,
      userTeam.freeTransfers,
      userTeam.createdAt,
    );
  }

  async findByUserAndSeason(
    userId: string,
    seasonId: string,
  ): Promise<UserTeamEntity | null> {
    const userTeam = await this.prisma.userTeam.findUnique({
      where: {
        userId_seasonId: {
          userId,
          seasonId,
        },
      },
    });

    if (!userTeam) {
      return null;
    }

    return new UserTeamEntity(
      userTeam.userTeamId,
      userTeam.userId,
      userTeam.seasonId,
      userTeam.teamName,
      userTeam.budgetLimit,
      userTeam.totalPoints,
      userTeam.freeTransfers,
      userTeam.createdAt,
    );
  }

  async create(data: CreateUserTeamData): Promise<UserTeamEntity> {
    const userTeam = await this.prisma.userTeam.create({
      data: {
        userId: data.userId,
        seasonId: data.seasonId,
        teamName: data.teamName,
        budgetLimit: data.budgetLimit,
        freeTransfers: data.freeTransfers,
      },
    });

    return new UserTeamEntity(
      userTeam.userTeamId,
      userTeam.userId,
      userTeam.seasonId,
      userTeam.teamName,
      userTeam.budgetLimit,
      userTeam.totalPoints,
      userTeam.freeTransfers,
      userTeam.createdAt,
    );
  }
}
