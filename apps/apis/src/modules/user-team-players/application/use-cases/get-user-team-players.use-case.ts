import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  USER_TEAM_REPOSITORY,
  UserTeamRepository,
} from "../../../user-teams/domain/repositories/user-team.repository";

import {
  USER_TEAM_PLAYER_REPOSITORY,
  UserTeamPlayerRepository,
} from "../../domain/repositories/user-team-player.repository";

import { UserTeamPlayerResponseDto } from "../dto/get-user-team-player-response.dto";

@Injectable()
export class GetUserTeamPlayersUseCase {
  constructor(
    @Inject(USER_TEAM_REPOSITORY)
    private readonly userTeamRepository: UserTeamRepository,

    @Inject(USER_TEAM_PLAYER_REPOSITORY)
    private readonly userTeamPlayerRepository: UserTeamPlayerRepository,
  ) {}

  async execute(
    userId: string,
    userTeamId: string,
  ): Promise<UserTeamPlayerResponseDto[]> {
    const userTeam =
      await this.userTeamRepository.findById(userTeamId);

    if (!userTeam) {
      throw new NotFoundException("User team not found");
    }

    if (userTeam.userId !== userId) {
      throw new ForbiddenException(
        "You do not have access to this user team",
      );
    }

    const entries =
      await this.userTeamPlayerRepository.findActiveByUserTeamId(
        userTeamId,
      );

    return entries.map((entry) => {
      if (!entry.player) {
        throw new Error(
          "Player relation was not loaded for user team player",
        );
      }

      return {
        userTeamPlayerId: entry.userTeamPlayerId,
        userTeamId: entry.userTeamId,
        playerId: entry.playerId,
        purchasePrice: entry.purchasePrice.toFixed(2),
        isActive: entry.isActive,
        joinedAt: entry.joinedAt.toISOString(),
        leftAt: entry.leftAt?.toISOString() ?? null,

        player: {
          playerId: entry.player.playerId,
          name: entry.player.name,
          clubId: entry.player.clubId,
          position: entry.player.position,
          status: entry.player.status,
          currentPrice: entry.player.currentPrice.toFixed(2),

          club: {
            clubId: entry.player.club.clubId,
            name: entry.player.club.name,
            shortName: entry.player.club.shortName,
          },
        },
      };
    });
  }
}