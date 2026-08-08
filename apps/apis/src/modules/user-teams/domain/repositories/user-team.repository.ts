import { UserTeamEntity } from "../entities/user-team.entity";

export const USER_TEAM_REPOSITORY = "USER_TEAM_REPOSITORY";

export type CreateUserTeamData = {
  userId: string;
  seasonId: string;
  teamName: string;
  budgetLimit: string;
  freeTransfers: number;
};

export interface UserTeamRepository {
  findById(userTeamId: string): Promise<UserTeamEntity | null>;

  findByUserAndSeason(
    userId: string,
    seasonId: string,
  ): Promise<UserTeamEntity | null>;

  create(data: CreateUserTeamData): Promise<UserTeamEntity>;
}