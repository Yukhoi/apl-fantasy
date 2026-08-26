import { Prisma } from "@prisma/client";
import { UserTeamPlayerEntity } from "../entities/user-team-player.entity";

export const USER_TEAM_PLAYER_REPOSITORY = "USER_TEAM_PLAYER_REPOSITORY";

export type CreateUserTeamPlayerData = {
  userTeamId: string;
  playerId: string;
  purchasePrice: string;
};

export interface UserTeamPlayerRepository {
  findActiveByUserTeamId(userTeamId: string): Promise<UserTeamPlayerEntity[]>;

  createMany(
    players: CreateUserTeamPlayerData[],
  ): Promise<UserTeamPlayerEntity[]>;

  createInitialSquadWithBudgetUpdate(
    players: CreateUserTeamPlayerData[],
    userTeamId: string,
    budgetBalance: Prisma.Decimal,
  ): Promise<void>;
}
