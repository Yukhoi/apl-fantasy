import { UserTeamEntity } from "../../domain/entities/user-team.entity";
import { UserTeamResponseDto } from "../dto/user-team-response.dto";

export class UserTeamMapper {
  static toResponse(
    userTeam: UserTeamEntity,
  ): UserTeamResponseDto {
    return {
      userTeamId: userTeam.userTeamId,
      userId: userTeam.userId,
      seasonId: userTeam.seasonId,
      teamName: userTeam.teamName,
      budgetLimit: userTeam.budgetLimit.toFixed(2),
      totalPoints: userTeam.totalPoints,
      freeTransfers: userTeam.freeTransfers,
      createdAt: userTeam.createdAt.toISOString(),
    };
  }
}