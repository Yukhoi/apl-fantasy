import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PlayerPosition, PlayerStatus, Prisma } from "@prisma/client";

import { GetUserTeamPlayersUseCase } from "./get-user-team-players.use-case";

import { UserTeamRepository } from "../../../user-teams/domain/repositories/user-team.repository";
import { UserTeamEntity } from "../../../user-teams/domain/entities/user-team.entity";

import { UserTeamPlayerRepository } from "../../domain/repositories/user-team-player.repository";
import { UserTeamPlayerEntity } from "../../domain/entities/user-team-player.entity";
import { SquadPlayerClubEntity, SquadPlayerEntity } from "../../domain/entities/squad-player.entity";

describe("GetUserTeamPlayersUseCase", () => {
  let useCase: GetUserTeamPlayersUseCase;

  let userTeamRepository: jest.Mocked<UserTeamRepository>;
  let userTeamPlayerRepository: jest.Mocked<UserTeamPlayerRepository>;

  beforeEach(() => {
    userTeamRepository = {
      findById: jest.fn(),
      findByUserAndSeason: jest.fn(),
      create: jest.fn(),
    };

    userTeamPlayerRepository = {
      findActiveByUserTeamId: jest.fn(),
      createMany: jest.fn(),
    };

    useCase = new GetUserTeamPlayersUseCase(
      userTeamRepository,
      userTeamPlayerRepository,
    );
  });

  it("should return active players for the user's team", async () => {
    // Arrange
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const playerId = "55555555-5555-4555-8555-555555555555";

    const clubId = "66666666-6666-4666-8666-666666666666";

    const joinedAt = new Date("2026-08-24T11:00:00.000Z");

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date("2026-08-24T10:00:00.000Z"),
      ),
    );

    const squadPlayers = [
      new UserTeamPlayerEntity(
        "44444444-4444-4444-8444-444444444444",
        userTeamId,
        playerId,
        new Prisma.Decimal("7.50"),
        true,
        joinedAt,
        null,

        new SquadPlayerEntity(
          playerId,
          "Ada Hegerberg",
          clubId,
          PlayerPosition.FWD,
          PlayerStatus.Available,
          new Prisma.Decimal("8.00"),

          new SquadPlayerClubEntity(clubId, "OL Lyonnes", "OLL"),
        ),
      ),
    ];

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue(
      squadPlayers,
    );

    // Act
    const result = await useCase.execute(userId, userTeamId);

    // Assert
    expect(userTeamRepository.findById).toHaveBeenCalledWith(userTeamId);

    expect(
      userTeamPlayerRepository.findActiveByUserTeamId,
    ).toHaveBeenCalledWith(userTeamId);

    expect(result).toEqual([
      {
        userTeamPlayerId: "44444444-4444-4444-8444-444444444444",
        userTeamId,
        playerId,
        purchasePrice: "7.50",
        isActive: true,
        joinedAt: "2026-08-24T11:00:00.000Z",
        leftAt: null,

        player: {
          playerId,
          name: "Ada Hegerberg",
          clubId,
          position: PlayerPosition.FWD,
          status: PlayerStatus.Available,
          currentPrice: "8.00",

          club: {
            clubId,
            name: "OL Lyonnes",
            shortName: "OLL",
          },
        },
      },
    ]);
  });

  it("should throw NotFoundException when user team does not exist", async () => {
    // Arrange
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    userTeamRepository.findById.mockResolvedValue(null);

    // Act + Assert
    await expect(useCase.execute(userId, userTeamId)).rejects.toThrow(
      NotFoundException,
    );

    expect(
      userTeamPlayerRepository.findActiveByUserTeamId,
    ).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenException when user team belongs to another user", async () => {
    // Arrange
    const currentUserId = "11111111-1111-4111-8111-111111111111";

    const ownerUserId = "99999999-9999-4999-8999-999999999999";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        ownerUserId,
        "33333333-3333-4333-8333-333333333333",
        "Other Team",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date(),
      ),
    );

    // Act + Assert
    await expect(useCase.execute(currentUserId, userTeamId)).rejects.toThrow(
      ForbiddenException,
    );

    expect(
      userTeamPlayerRepository.findActiveByUserTeamId,
    ).not.toHaveBeenCalled();
  });
});
