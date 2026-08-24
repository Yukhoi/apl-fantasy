import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import {
  USER_TEAM_REPOSITORY,
  UserTeamRepository,
} from "../../../user-teams/domain/repositories/user-team.repository";

import {
  PLAYER_REPOSITORY,
  PlayerRepository,
} from "../../../players/domain/repositories/player.repository";

import {
  USER_TEAM_PLAYER_REPOSITORY,
  UserTeamPlayerRepository,
} from "../../domain/repositories/user-team-player.repository";

import {
  INITIAL_SQUAD_POSITION_LIMITS,
  MAX_PLAYERS_PER_CLUB,
} from "../../domain/constants/squad-rules";

import { CreateInitialSquadDto } from "../dto/create-initial-squad.dto";
import { CreateInitialSquadResponseDto } from "../dto/create-initial-squad-response.dto";

@Injectable()
export class CreateInitialSquadUseCase {
  constructor(
    @Inject(USER_TEAM_REPOSITORY)
    private readonly userTeamRepository: UserTeamRepository,

    @Inject(PLAYER_REPOSITORY)
    private readonly playerRepository: PlayerRepository,

    @Inject(USER_TEAM_PLAYER_REPOSITORY)
    private readonly userTeamPlayerRepository: UserTeamPlayerRepository,
  ) {}

  async execute(
    userId: string,
    userTeamId: string,
    input: CreateInitialSquadDto,
  ): Promise<CreateInitialSquadResponseDto> {
    if (input.playerIds.length !== 15) {
      throw new BadRequestException(
        "Initial squad must contain exactly 15 players",
      );
    }

    const uniquePlayerIds = new Set(input.playerIds);

    if (uniquePlayerIds.size !== input.playerIds.length) {
      throw new BadRequestException(
        "Initial squad cannot contain duplicate players",
      );
    }

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

    const activePlayers =
      await this.userTeamPlayerRepository.findActiveByUserTeamId(
        userTeamId,
      );

    if (activePlayers.length > 0) {
      throw new ConflictException(
        "Initial squad has already been created",
      );
    }

    const players =
      await this.playerRepository.findByIds(input.playerIds);

    if (players.length !== input.playerIds.length) {
      throw new NotFoundException(
        "One or more players were not found",
      );
    }

    const positionCounts = players.reduce(
      (counts, player) => {
        counts[player.position] =
          (counts[player.position] ?? 0) + 1;

        return counts;
      },
      {} as Record<string, number>,
    );

    const hasValidPositions =
      positionCounts.GK === INITIAL_SQUAD_POSITION_LIMITS.GK &&
      positionCounts.DEF === INITIAL_SQUAD_POSITION_LIMITS.DEF &&
      positionCounts.MID === INITIAL_SQUAD_POSITION_LIMITS.MID &&
      positionCounts.FWD === INITIAL_SQUAD_POSITION_LIMITS.FWD;

    if (!hasValidPositions) {
      throw new BadRequestException(
        "Initial squad must contain 2 GK, 5 DEF, 5 MID and 3 FWD",
      );
    }

    const playersPerClub = players.reduce(
      (counts, player) => {
        counts[player.clubId] =
          (counts[player.clubId] ?? 0) + 1;

        return counts;
      },
      {} as Record<string, number>,
    );

    const exceedsClubLimit = Object.values(
      playersPerClub,
    ).some(
      (count) => count > MAX_PLAYERS_PER_CLUB,
    );

    if (exceedsClubLimit) {
      throw new BadRequestException(
        `Initial squad cannot contain more than ${MAX_PLAYERS_PER_CLUB} players from the same club`,
      );
    }

    const totalPrice = players.reduce(
      (total, player) =>
        total.plus(player.currentPrice),
      new Prisma.Decimal(0),
    );

    if (totalPrice.greaterThan(userTeam.budgetLimit)) {
      throw new BadRequestException(
        "Initial squad exceeds the team budget limit",
      );
    }

    const squadEntries = players.map((player) => ({
      userTeamId,
      playerId: player.playerId,
      purchasePrice: player.currentPrice.toFixed(2),
    }));

    await this.userTeamPlayerRepository.createMany(
      squadEntries,
    );

    return {
      userTeamId,
      playerCount: squadEntries.length,
    };
  }
}