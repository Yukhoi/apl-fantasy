import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PlayerPosition, PlayerStatus, Prisma } from "@prisma/client";

import { CreateInitialSquadUseCase } from "./create-initial-squad.use-case";

import { PlayerEntity } from "../../../players/domain/entities/player.entity";
import { PlayerRepository } from "../../../players/domain/repositories/player.repository";

import { UserTeamEntity } from "../../../user-teams/domain/entities/user-team.entity";
import { UserTeamRepository } from "../../../user-teams/domain/repositories/user-team.repository";

import { UserTeamPlayerRepository } from "../../domain/repositories/user-team-player.repository";

describe("CreateInitialSquadUseCase", () => {
  let useCase: CreateInitialSquadUseCase;

  let userTeamRepository: jest.Mocked<UserTeamRepository>;
  let playerRepository: jest.Mocked<PlayerRepository>;
  let userTeamPlayerRepository: jest.Mocked<UserTeamPlayerRepository>;

  beforeEach(() => {
    userTeamRepository = {
      findById: jest.fn(),
      findByUserAndSeason: jest.fn(),
      create: jest.fn(),
    };

    playerRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    userTeamPlayerRepository = {
      findActiveByUserTeamId: jest.fn(),
      createMany: jest.fn(),
    };

    useCase = new CreateInitialSquadUseCase(
      userTeamRepository,
      playerRepository,
      userTeamPlayerRepository,
    );
  });

  it("should create an initial squad with 15 valid players", async () => {
    // Arrange
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const players = createValidPlayers();

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date(),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([]);

    playerRepository.findByIds.mockResolvedValue(players);

    userTeamPlayerRepository.createMany.mockResolvedValue([]);

    const input = {
      playerIds: players.map((player) => player.playerId),
    };

    // Act
    await useCase.execute(userId, userTeamId, input);

    // Assert
    expect(userTeamRepository.findById).toHaveBeenCalledWith(userTeamId);

    expect(
      userTeamPlayerRepository.findActiveByUserTeamId,
    ).toHaveBeenCalledWith(userTeamId);

    expect(playerRepository.findByIds).toHaveBeenCalledWith(input.playerIds);

    expect(userTeamPlayerRepository.createMany).toHaveBeenCalledTimes(1);

    expect(userTeamPlayerRepository.createMany).toHaveBeenCalledWith(
      players.map((player) => ({
        userTeamId,
        playerId: player.playerId,
        purchasePrice: player.currentPrice.toFixed(2),
      })),
    );
  });

  it("should reject a squad that does not contain exactly 15 players", async () => {
    // Arrange
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const players = createValidPlayers();

    const input = {
      playerIds: players.slice(0, 14).map((player) => player.playerId),
    };

    // Act + Assert
    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      BadRequestException,
    );

    expect(userTeamRepository.findById).not.toHaveBeenCalled();

    expect(playerRepository.findByIds).not.toHaveBeenCalled();

    expect(userTeamPlayerRepository.createMany).not.toHaveBeenCalled();
  });

  it("should reject duplicate players", async () => {
    // Arrange
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const players = createValidPlayers();

    const playerIds = players.map((player) => player.playerId);

    playerIds[14] = playerIds[0];

    // Act + Assert
    await expect(
      useCase.execute(userId, userTeamId, { playerIds }),
    ).rejects.toThrow(BadRequestException);

    expect(userTeamRepository.findById).not.toHaveBeenCalled();

    expect(playerRepository.findByIds).not.toHaveBeenCalled();

    expect(userTeamPlayerRepository.createMany).not.toHaveBeenCalled();
  });

  it("should throw NotFoundException when user team does not exist", async () => {
    // Arrange
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const players = createValidPlayers();

    userTeamRepository.findById.mockResolvedValue(null);

    // Act + Assert
    await expect(
      useCase.execute(userId, userTeamId, {
        playerIds: players.map((player) => player.playerId),
      }),
    ).rejects.toThrow(NotFoundException);

    expect(
      userTeamPlayerRepository.findActiveByUserTeamId,
    ).not.toHaveBeenCalled();

    expect(playerRepository.findByIds).not.toHaveBeenCalled();

    expect(userTeamPlayerRepository.createMany).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenException when user team belongs to another user", async () => {
    // Arrange
    const currentUserId = "11111111-1111-4111-8111-111111111111";

    const ownerUserId = "99999999-9999-4999-8999-999999999999";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const players = createValidPlayers();

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        ownerUserId, // 注意：属于另一个用户
        seasonId,
        "Other User FC",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date(),
      ),
    );

    // Act + Assert
    await expect(
      useCase.execute(currentUserId, userTeamId, {
        playerIds: players.map((player) => player.playerId),
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(userTeamRepository.findById).toHaveBeenCalledWith(userTeamId);

    // ownership 已经失败，后面的操作不应该发生
    expect(
      userTeamPlayerRepository.findActiveByUserTeamId,
    ).not.toHaveBeenCalled();

    expect(playerRepository.findByIds).not.toHaveBeenCalled();

    expect(userTeamPlayerRepository.createMany).not.toHaveBeenCalled();
  });

  it("should throw ConflictException when user team already has an active squad", async () => {
    // Arrange
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const players = createValidPlayers();

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date(),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([
      {
        userTeamPlayerId: "44444444-4444-4444-8444-444444444444",
        userTeamId,
        playerId: players[0].playerId,
        purchasePrice: new Prisma.Decimal("5.00"),
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
      },
    ]);

    // Act + Assert
    await expect(
      useCase.execute(userId, userTeamId, {
        playerIds: players.map((player) => player.playerId),
      }),
    ).rejects.toThrow(ConflictException);

    expect(
      userTeamPlayerRepository.findActiveByUserTeamId,
    ).toHaveBeenCalledWith(userTeamId);

    expect(playerRepository.findByIds).not.toHaveBeenCalled();

    expect(userTeamPlayerRepository.createMany).not.toHaveBeenCalled();
  });

  it("should throw NotFoundException when one or more players do not exist", async () => {
    // Arrange
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const players = createValidPlayers();

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date(),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([]);

    // 模拟只查到14个，说明有一个playerId不存在
    playerRepository.findByIds.mockResolvedValue(players.slice(0, 14));

    const input = {
      playerIds: players.map((player) => player.playerId),
    };

    // Act + Assert
    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      NotFoundException,
    );

    expect(playerRepository.findByIds).toHaveBeenCalledWith(input.playerIds);

    expect(userTeamPlayerRepository.createMany).not.toHaveBeenCalled();
  });

  it("should reject a squad with invalid position distribution", async () => {
    // Arrange
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const players = createValidPlayers();

    // 把一个 DEF 改成 GK
    const invalidPlayers = [
      ...players.slice(0, 2),

      createPlayer(3, PlayerPosition.GK, 1),

      ...players.slice(3),
    ];

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date(),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([]);

    playerRepository.findByIds.mockResolvedValue(invalidPlayers);

    // Act + Assert
    await expect(
      useCase.execute(userId, userTeamId, {
        playerIds: invalidPlayers.map((player) => player.playerId),
      }),
    ).rejects.toThrow(BadRequestException);

    expect(userTeamPlayerRepository.createMany).not.toHaveBeenCalled();
  });

  it("should reject a squad with more than 3 players from the same club", async () => {
    // Arrange
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const players = createValidPlayers();

    // 让第4个球员和前三个属于同一个 club
    const sameClubId = players[0].clubId;

    const invalidPlayers = players.map((player, index) => {
      if (index === 3) {
        return new PlayerEntity(
          player.playerId,
          player.name,
          sameClubId,
          player.position,
          player.status,
          player.currentPrice,
          player.club,
        );
      }

      return player;
    });

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date(),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([]);

    playerRepository.findByIds.mockResolvedValue(invalidPlayers);

    // Act + Assert
    await expect(
      useCase.execute(userId, userTeamId, {
        playerIds: invalidPlayers.map((player) => player.playerId),
      }),
    ).rejects.toThrow(BadRequestException);

    expect(userTeamPlayerRepository.createMany).not.toHaveBeenCalled();
  });

  it("should reject a squad when total player price exceeds budget limit", async () => {
    // Arrange
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const players = createValidPlayers().map(
      (player) =>
        new PlayerEntity(
          player.playerId,
          player.name,
          player.clubId,
          player.position,
          player.status,
          new Prisma.Decimal("10.00"),
          player.club,
        ),
    );

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date(),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([]);

    playerRepository.findByIds.mockResolvedValue(players);

    // Act + Assert
    await expect(
      useCase.execute(userId, userTeamId, {
        playerIds: players.map((player) => player.playerId),
      }),
    ).rejects.toThrow(BadRequestException);

    expect(userTeamPlayerRepository.createMany).not.toHaveBeenCalled();
  });

  it("should allow a squad when total price equals budget limit", async () => {
    // Arrange
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const basePlayers = createValidPlayers();

    const players = basePlayers.map(
      (player, index) =>
        new PlayerEntity(
          player.playerId,
          player.name,
          player.clubId,
          player.position,
          player.status,
          new Prisma.Decimal(index === 14 ? "16.00" : "6.00"),
          player.club,
        ),
    );

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date(),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([]);

    playerRepository.findByIds.mockResolvedValue(players);

    userTeamPlayerRepository.createMany.mockResolvedValue([]);

    // Act + Assert
    await expect(
      useCase.execute(userId, userTeamId, {
        playerIds: players.map((player) => player.playerId),
      }),
    ).resolves.not.toThrow();

    expect(userTeamPlayerRepository.createMany).toHaveBeenCalledTimes(1);
  });

  it("should allow injured, suspended and unavailable players", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const players = createValidPlayers();

    const playersWithStatuses = players.map(
      (player, index) =>
        new PlayerEntity(
          player.playerId,
          player.name,
          player.clubId,
          player.position,
          index === 0
            ? PlayerStatus.Injured
            : index === 1
              ? PlayerStatus.Suspended
              : index === 2
                ? PlayerStatus.Unavailable
                : player.status,
          player.currentPrice,
          player.club,
        ),
    );

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date(),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([]);

    playerRepository.findByIds.mockResolvedValue(playersWithStatuses);

    userTeamPlayerRepository.createMany.mockResolvedValue([]);

    await expect(
      useCase.execute(userId, userTeamId, {
        playerIds: playersWithStatuses.map((player) => player.playerId),
      }),
    ).resolves.not.toThrow();

    expect(userTeamPlayerRepository.createMany).toHaveBeenCalledTimes(1);
  });
});

function createPlayer(
  id: number,
  position: PlayerPosition,
  clubNumber: number,
  status: PlayerStatus = PlayerStatus.Available,
  price = "5.00",
): PlayerEntity {
  return new PlayerEntity(
    `00000000-0000-4000-8000-${id.toString().padStart(12, "0")}`,
    `Player ${id}`,
    `10000000-0000-4000-8000-${clubNumber.toString().padStart(12, "0")}`,
    position,
    status,
    new Prisma.Decimal(price),
  );
}

function createValidPlayers(): PlayerEntity[] {
  return [
    // GK × 2
    createPlayer(1, PlayerPosition.GK, 1),
    createPlayer(2, PlayerPosition.GK, 2),

    // DEF × 5
    createPlayer(3, PlayerPosition.DEF, 1),
    createPlayer(4, PlayerPosition.DEF, 2),
    createPlayer(5, PlayerPosition.DEF, 3),
    createPlayer(6, PlayerPosition.DEF, 4),
    createPlayer(7, PlayerPosition.DEF, 5),

    // MID × 5
    createPlayer(8, PlayerPosition.MID, 1),
    createPlayer(9, PlayerPosition.MID, 2),
    createPlayer(10, PlayerPosition.MID, 3),
    createPlayer(11, PlayerPosition.MID, 4),
    createPlayer(12, PlayerPosition.MID, 5),

    // FWD × 3
    createPlayer(13, PlayerPosition.FWD, 3),
    createPlayer(14, PlayerPosition.FWD, 4),
    createPlayer(15, PlayerPosition.FWD, 5),
  ];
}
