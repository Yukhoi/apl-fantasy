import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";

import { ExecuteTransferBatchUseCase } from "./execute-transfer-batch.use-case";

import { UserTeamRepository } from "../../../user-teams/domain/repositories/user-team.repository";

import { UserTeamEntity } from "../../../user-teams/domain/entities/user-team.entity";

import { GameweekRepository } from "src/modules/gameweeks/domain/repositories/gameweek.repository";

import { GameweekEntity } from "../../../gameweeks/domain/entities/gameweek.entity";

import { UserTeamPlayerRepository } from "../../../user-team-players/domain/repositories/user-team-player.repository";

import { TransferBatchRepository } from "../../domain/repositories/transfer-batch.repository";

import { PlayerRepository } from "../../../players/domain/repositories/player.repository";

import { PlayerEntity } from "../../../players/domain/entities/player.entity";

import {
  SquadPlayerEntity,
  SquadPlayerClubEntity,
} from "../../../user-team-players/domain/entities/squad-player.entity";

import { TransferBatchEntity } from "../../domain/entities/transfer-batch.entity";

import { UserTeamPlayerEntity } from "../../../user-team-players/domain/entities/user-team-player.entity";

import {
  PlayerPosition,
  PlayerStatus,
  TransferBatchStatus,
  Prisma,
} from "@prisma/client";

describe("ExecuteTransferBatchUseCase", () => {
  let useCase: ExecuteTransferBatchUseCase;

  let userTeamRepository: jest.Mocked<UserTeamRepository>;

  let gameweekRepository: jest.Mocked<GameweekRepository>;

  let userTeamPlayerRepository: jest.Mocked<UserTeamPlayerRepository>;

  let playerRepository: jest.Mocked<PlayerRepository>;

  let transferBatchRepository: jest.Mocked<TransferBatchRepository>;

  beforeEach(() => {
    userTeamRepository = {
      findById: jest.fn(),
      findByUserAndSeason: jest.fn(),
      create: jest.fn(),
      updateBudgetBalance: jest.fn(),
    };

    gameweekRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
    };

    userTeamPlayerRepository = {
      findActiveByUserTeamId: jest.fn(),
      createMany: jest.fn(),
      createInitialSquadWithBudgetUpdate: jest.fn(),
    };

    playerRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    transferBatchRepository = {
      executeConfirmedBatch: jest.fn(),
    };

    useCase = new ExecuteTransferBatchUseCase(
      userTeamRepository,
      gameweekRepository,
      userTeamPlayerRepository,
      playerRepository,
      transferBatchRepository,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should throw NotFoundException when user team does not exist", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const input = {
      gameweekId: "33333333-3333-4333-8333-333333333333",

      transfers: [
        {
          playerOutId: "44444444-4444-4444-8444-444444444444",

          playerInId: "55555555-5555-4555-8555-555555555555",
        },
      ],
    };

    userTeamRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      NotFoundException,
    );

    expect(userTeamRepository.findById).toHaveBeenCalledWith(userTeamId);
  });

  it("should throw ForbiddenException when user team belongs to another user", async () => {
    const currentUserId = "11111111-1111-4111-8111-111111111111";

    const ownerUserId = "99999999-9999-4999-8999-999999999999";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const input = {
      gameweekId: "44444444-4444-4444-8444-444444444444",

      transfers: [
        {
          playerOutId: "55555555-5555-4555-8555-555555555555",

          playerInId: "66666666-6666-4666-8666-666666666666",
        },
      ],
    };

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        ownerUserId,
        seasonId,
        "Other User FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date(),
      ),
    );

    await expect(
      useCase.execute(currentUserId, userTeamId, input),
    ).rejects.toThrow(ForbiddenException);

    expect(userTeamRepository.findById).toHaveBeenCalledWith(userTeamId);
  });

  it("should throw NotFoundException when gameweek does not exist", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(null);

    const input = {
      gameweekId,
      transfers: [
        {
          playerOutId: "55555555-5555-4555-8555-555555555555",
          playerInId: "66666666-6666-4666-8666-666666666666",
        },
      ],
    };

    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      NotFoundException,
    );

    expect(gameweekRepository.findById).toHaveBeenCalledWith(gameweekId);
  });

  it("should throw BadRequestException when gameweek belongs to another season", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const userTeamSeasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekSeasonId = "99999999-9999-4999-8999-999999999999";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        userTeamSeasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        gameweekSeasonId,
        1,
        new Date("2026-09-05T18:00:00Z"), // deadlineAt
        new Date("2026-09-05T20:00:00Z"), // startsAt
        new Date("2026-09-07T23:00:00Z"), // endsAt
      ),
    );

    const input = {
      gameweekId,
      transfers: [
        {
          playerOutId: "55555555-5555-4555-8555-555555555555",
          playerInId: "66666666-6666-4666-8666-666666666666",
        },
      ],
    };

    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      BadRequestException,
    );

    expect(userTeamRepository.findById).toHaveBeenCalledWith(userTeamId);

    expect(gameweekRepository.findById).toHaveBeenCalledWith(gameweekId);
  });

  it("should throw BadRequestException when transfer deadline has passed", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    jest.useFakeTimers();

    jest.setSystemTime(new Date("2026-09-05T18:01:00Z"));

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"), // deadlineAt
        new Date("2026-09-05T20:00:00Z"), // startsAt
        new Date("2026-09-07T23:00:00Z"), // endsAt
      ),
    );

    const input = {
      gameweekId,
      transfers: [
        {
          playerOutId: "55555555-5555-4555-8555-555555555555",
          playerInId: "66666666-6666-4666-8666-666666666666",
        },
      ],
    };

    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      BadRequestException,
    );

    jest.useRealTimers();
  });

  it("should allow transfer execution before the gameweek deadline", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    const playerOutId = "55555555-5555-4555-8555-555555555555";

    const playerInId = "66666666-6666-4666-8666-666666666666";

    jest.useFakeTimers();

    jest.setSystemTime(new Date("2026-09-05T17:59:00Z"));

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date("2026-08-01T10:00:00Z"),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"), // deadlineAt
        new Date("2026-09-05T20:00:00Z"), // startsAt
        new Date("2026-09-07T23:00:00Z"), // endsAt
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([
      {
        userTeamPlayerId: "77777777-7777-4777-8777-777777777777",
        userTeamId,
        playerId: playerOutId,
        purchasePrice: new Prisma.Decimal("7.00"),
        isActive: true,
        joinedAt: new Date("2026-08-01T10:00:00Z"),
        leftAt: null,
      },
    ]);

    const playerOut = new PlayerEntity(
      playerOutId,
      "Player Out",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      PlayerPosition.DEF,
      PlayerStatus.Available,
      new Prisma.Decimal("7.00"),
    );

    const playerIn = new PlayerEntity(
      playerInId,
      "Player In",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      PlayerPosition.DEF,
      PlayerStatus.Available,
      new Prisma.Decimal("8.00"),
    );

    playerRepository.findByIds.mockResolvedValue([playerOut, playerIn]);

    const input = {
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
        },
      ],
    };

    await expect(
      useCase.execute(userId, userTeamId, input),
    ).resolves.not.toThrow();

    expect(userTeamRepository.findById).toHaveBeenCalledWith(userTeamId);

    expect(gameweekRepository.findById).toHaveBeenCalledWith(gameweekId);

    expect(
      userTeamPlayerRepository.findActiveByUserTeamId,
    ).toHaveBeenCalledWith(userTeamId);

    expect(playerRepository.findByIds).toHaveBeenCalledWith([
      playerOutId,
      playerInId,
    ]);
  });

  it("should throw BadRequestException when no transfers are provided", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    jest.useFakeTimers();

    jest.setSystemTime(new Date("2026-09-05T17:00:00Z"));

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"),
        new Date("2026-09-05T20:00:00Z"),
        new Date("2026-09-07T23:00:00Z"),
      ),
    );

    const input = {
      gameweekId,
      transfers: [],
    };

    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should throw BadRequestException when the same player is transferred out more than once", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-05T17:00:00Z"));

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"),
        new Date("2026-09-05T20:00:00Z"),
        new Date("2026-09-07T23:00:00Z"),
      ),
    );

    const samePlayerOutId = "55555555-5555-4555-8555-555555555555";

    const input = {
      gameweekId,
      transfers: [
        {
          playerOutId: samePlayerOutId,
          playerInId: "66666666-6666-4666-8666-666666666666",
        },
        {
          playerOutId: samePlayerOutId,
          playerInId: "77777777-7777-4777-8777-777777777777",
        },
      ],
    };

    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should throw BadRequestException when playerOut is not in the active squad", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    const playerOutId = "55555555-5555-4555-8555-555555555555";

    const playerInId = "66666666-6666-4666-8666-666666666666";

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-05T17:00:00Z"));

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"),
        new Date("2026-09-05T20:00:00Z"),
        new Date("2026-09-07T23:00:00Z"),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([]);

    const input = {
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
        },
      ],
    };

    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      BadRequestException,
    );

    expect(
      userTeamPlayerRepository.findActiveByUserTeamId,
    ).toHaveBeenCalledWith(userTeamId);
  });

  it("should throw BadRequestException when playerIn is already in the active squad", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    const playerOutId = "55555555-5555-4555-8555-555555555555";

    const playerInId = "66666666-6666-4666-8666-666666666666";

    jest.useFakeTimers();

    jest.setSystemTime(new Date("2026-09-05T17:00:00Z"));

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"),
        new Date("2026-09-05T20:00:00Z"),
        new Date("2026-09-07T23:00:00Z"),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([
      {
        userTeamPlayerId: "77777777-7777-4777-8777-777777777777",
        userTeamId,
        playerId: playerOutId,
        purchasePrice: new Prisma.Decimal("5.00"),
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
      },
      {
        userTeamPlayerId: "88888888-8888-4888-8888-888888888888",
        userTeamId,
        playerId: playerInId,
        purchasePrice: new Prisma.Decimal("6.00"),
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
      },
    ]);

    const input = {
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
        },
      ],
    };

    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should throw NotFoundException when one or more transfer players do not exist", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    const playerOutId = "55555555-5555-4555-8555-555555555555";

    const playerInId = "66666666-6666-4666-8666-666666666666";

    jest.useFakeTimers();

    jest.setSystemTime(new Date("2026-09-05T17:00:00Z"));

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"),
        new Date("2026-09-05T20:00:00Z"),
        new Date("2026-09-07T23:00:00Z"),
      ),
    );

    // playerOut 确实属于当前阵容
    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([
      {
        userTeamPlayerId: "77777777-7777-4777-8777-777777777777",
        userTeamId,
        playerId: playerOutId,
        purchasePrice: new Prisma.Decimal("5.00"),
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
      },
    ]);

    // 模拟只找到了 playerOut，
    // playerIn 不存在
    playerRepository.findByIds.mockResolvedValue([
      {
        playerId: playerOutId,
      } as any,
    ]);

    const input = {
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
        },
      ],
    };

    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      NotFoundException,
    );

    expect(playerRepository.findByIds).toHaveBeenCalledWith([
      playerOutId,
      playerInId,
    ]);
  });

  it("should throw BadRequestException when playerOut and playerIn have different positions", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    const playerOutId = "55555555-5555-4555-8555-555555555555";

    const playerInId = "66666666-6666-4666-8666-666666666666";

    jest.useFakeTimers();

    jest.setSystemTime(new Date("2026-09-05T17:00:00Z"));

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"),
        new Date("2026-09-05T20:00:00Z"),
        new Date("2026-09-07T23:00:00Z"),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([
      {
        userTeamPlayerId: "77777777-7777-4777-8777-777777777777",
        userTeamId,
        playerId: playerOutId,
        purchasePrice: new Prisma.Decimal("5.00"),
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
      },
    ]);

    const playerOut = new PlayerEntity(
      playerOutId,
      "Player Out",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      PlayerPosition.DEF,
      PlayerStatus.Available,
      new Prisma.Decimal("7.00"),
    );

    const playerIn = new PlayerEntity(
      playerInId,
      "Player In",
      "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      PlayerPosition.MID,
      PlayerStatus.Available,
      new Prisma.Decimal("8.00"),
    );

    playerRepository.findByIds.mockResolvedValue([playerOut, playerIn]);

    const input = {
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
        },
      ],
    };

    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should throw BadRequestException when resulting squad has more than 3 players from the same club", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    const playerOutId = "55555555-5555-4555-8555-555555555555";

    const playerInId = "66666666-6666-4666-8666-666666666666";

    const targetClubId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    const otherClubId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

    jest.useFakeTimers();

    jest.setSystemTime(new Date("2026-09-05T17:00:00Z"));

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"),
        new Date("2026-09-05T20:00:00Z"),
        new Date("2026-09-07T23:00:00Z"),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([
      {
        userTeamPlayerId: "70000000-0000-4000-8000-000000000001",
        userTeamId,
        playerId: "71000000-0000-4000-8000-000000000001",
        purchasePrice: new Prisma.Decimal("6.00"),
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
        player: new SquadPlayerEntity(
          "71000000-0000-4000-8000-000000000001",
          "Club Player 1",
          targetClubId,
          PlayerPosition.DEF,
          PlayerStatus.Available,
          new Prisma.Decimal("6.00"),
          new SquadPlayerClubEntity(targetClubId, "Target Club", "TGT"),
        ),
      },
      {
        userTeamPlayerId: "70000000-0000-4000-8000-000000000002",
        userTeamId,
        playerId: "71000000-0000-4000-8000-000000000002",
        purchasePrice: new Prisma.Decimal("6.00"),
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
        player: new SquadPlayerEntity(
          "71000000-0000-4000-8000-000000000002",
          "Club Player 2",
          targetClubId,
          PlayerPosition.MID,
          PlayerStatus.Available,
          new Prisma.Decimal("6.00"),
          new SquadPlayerClubEntity(targetClubId, "Target Club", "TGT"),
        ),
      },
      {
        userTeamPlayerId: "70000000-0000-4000-8000-000000000003",
        userTeamId,
        playerId: "71000000-0000-4000-8000-000000000003",
        purchasePrice: new Prisma.Decimal("6.00"),
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
        player: new SquadPlayerEntity(
          "71000000-0000-4000-8000-000000000003",
          "Club Player 3",
          targetClubId,
          PlayerPosition.FWD,
          PlayerStatus.Available,
          new Prisma.Decimal("6.00"),
          new SquadPlayerClubEntity(targetClubId, "Target Club", "TGT"),
        ),
      },
      {
        userTeamPlayerId: "70000000-0000-4000-8000-000000000004",
        userTeamId,
        playerId: playerOutId,
        purchasePrice: new Prisma.Decimal("7.00"),
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
        player: new SquadPlayerEntity(
          playerOutId,
          "Player Out",
          otherClubId,
          PlayerPosition.DEF,
          PlayerStatus.Available,
          new Prisma.Decimal("7.00"),
          new SquadPlayerClubEntity(targetClubId, "Target Club", "TGT"),
        ),
      },
    ]);

    const playerOut = new PlayerEntity(
      playerOutId,
      "Player Out",
      otherClubId,
      PlayerPosition.DEF,
      PlayerStatus.Available,
      new Prisma.Decimal("7.00"),
    );

    const playerIn = new PlayerEntity(
      playerInId,
      "Player In",
      targetClubId,
      PlayerPosition.DEF,
      PlayerStatus.Available,
      new Prisma.Decimal("8.00"),
    );

    playerRepository.findByIds.mockResolvedValue([playerOut, playerIn]);

    const input = {
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
        },
      ],
    };

    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should throw BadRequestException when transfer exceeds available budget", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    const playerOutId = "55555555-5555-4555-8555-555555555555";

    const playerInId = "66666666-6666-4666-8666-666666666666";

    const clubOutId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    const clubInId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

    jest.useFakeTimers();

    jest.setSystemTime(new Date("2026-09-05T17:00:00Z"));

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("1.00"), // 当前只剩 1
        0,
        2,
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"),
        new Date("2026-09-05T20:00:00Z"),
        new Date("2026-09-07T23:00:00Z"),
      ),
    );

    const playerOut = new PlayerEntity(
      playerOutId,
      "Player Out",
      clubOutId,
      PlayerPosition.DEF,
      PlayerStatus.Available,
      new Prisma.Decimal("7.00"),
    );

    const playerIn = new PlayerEntity(
      playerInId,
      "Player In",
      clubInId,
      PlayerPosition.DEF,
      PlayerStatus.Available,
      new Prisma.Decimal("10.00"),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([
      new UserTeamPlayerEntity(
        "77777777-7777-4777-8777-777777777777",
        userTeamId,
        playerOutId,
        new Prisma.Decimal("7.00"),
        true,
        new Date(),
        null,
        new SquadPlayerEntity(
          playerOutId,
          "Player Out",
          clubOutId,
          PlayerPosition.DEF,
          PlayerStatus.Available,
          new Prisma.Decimal("7.00"),
          new SquadPlayerClubEntity(clubOutId, "Club Out", "OUT"),
        ),
      ),
    ]);

    playerRepository.findByIds.mockResolvedValue([playerOut, playerIn]);

    const input = {
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
        },
      ],
    };

    await expect(useCase.execute(userId, userTeamId, input)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should calculate free transfers correctly when transfers are within the free allowance", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    const playerOutId = "55555555-5555-4555-8555-555555555555";

    const playerInId = "66666666-6666-4666-8666-666666666666";

    const clubOutId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    const clubInId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-05T17:00:00Z"));

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2, // available free transfers
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"),
        new Date("2026-09-05T20:00:00Z"),
        new Date("2026-09-07T23:00:00Z"),
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([
      new UserTeamPlayerEntity(
        "77777777-7777-4777-8777-777777777777",
        userTeamId,
        playerOutId,
        new Prisma.Decimal("7.00"),
        true,
        new Date(),
        null,
        new SquadPlayerEntity(
          playerOutId,
          "Player Out",
          clubOutId,
          PlayerPosition.DEF,
          PlayerStatus.Available,
          new Prisma.Decimal("7.00"),
          new SquadPlayerClubEntity(clubOutId, "Club Out", "OUT"),
        ),
      ),
    ]);

    const playerOut = new PlayerEntity(
      playerOutId,
      "Player Out",
      clubOutId,
      PlayerPosition.DEF,
      PlayerStatus.Available,
      new Prisma.Decimal("7.00"),
    );

    const playerIn = new PlayerEntity(
      playerInId,
      "Player In",
      clubInId,
      PlayerPosition.DEF,
      PlayerStatus.Available,
      new Prisma.Decimal("8.00"),
    );

    playerRepository.findByIds.mockResolvedValue([playerOut, playerIn]);

    const result = await useCase.execute(userId, userTeamId, {
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
        },
      ],
    });

    expect(result.transfersMade).toBe(1);
    expect(result.freeTransfersUsed).toBe(1);
    expect(result.paidTransfers).toBe(0);
    expect(result.pointsCost).toBe(0);
    expect(result.freeTransfersAfter).toBe(1);

    expect(result.budgetBalanceAfter.equals(new Prisma.Decimal("24.00"))).toBe(
      true,
    );
  });

  it("should charge 4 points for each transfer exceeding available free transfers", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-05T17:00:00Z"));

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2, // only 2 free transfers
        new Date(),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"),
        new Date("2026-09-05T20:00:00Z"),
        new Date("2026-09-07T23:00:00Z"),
      ),
    );

    const transfers = [
      {
        playerOutId: "50000000-0000-4000-8000-000000000001",
        playerInId: "60000000-0000-4000-8000-000000000001",
      },
      {
        playerOutId: "50000000-0000-4000-8000-000000000002",
        playerInId: "60000000-0000-4000-8000-000000000002",
      },
      {
        playerOutId: "50000000-0000-4000-8000-000000000003",
        playerInId: "60000000-0000-4000-8000-000000000003",
      },
      {
        playerOutId: "50000000-0000-4000-8000-000000000004",
        playerInId: "60000000-0000-4000-8000-000000000004",
      },
    ];

    const activeSquad = transfers.map(
      (transfer, index) =>
        new UserTeamPlayerEntity(
          `70000000-0000-4000-8000-${(index + 1).toString().padStart(12, "0")}`,
          userTeamId,
          transfer.playerOutId,
          new Prisma.Decimal("5.00"),
          true,
          new Date(),
          null,
          new SquadPlayerEntity(
            transfer.playerOutId,
            `Player Out ${index + 1}`,
            `80000000-0000-4000-8000-${(index + 1)
              .toString()
              .padStart(12, "0")}`,
            PlayerPosition.DEF,
            PlayerStatus.Available,
            new Prisma.Decimal("5.00"),
            new SquadPlayerClubEntity(
              `80000000-0000-4000-8000-${(index + 1)
                .toString()
                .padStart(12, "0")}`,
              `Club Out ${index + 1}`,
              `O${index + 1}`,
            ),
          ),
        ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue(
      activeSquad,
    );

    const players = transfers.flatMap((transfer, index) => {
      const clubOutId = `80000000-0000-4000-8000-${(index + 1)
        .toString()
        .padStart(12, "0")}`;

      const clubInId = `90000000-0000-4000-8000-${(index + 1)
        .toString()
        .padStart(12, "0")}`;

      return [
        new PlayerEntity(
          transfer.playerOutId,
          `Player Out ${index + 1}`,
          clubOutId,
          PlayerPosition.DEF,
          PlayerStatus.Available,
          new Prisma.Decimal("5.00"),
        ),

        new PlayerEntity(
          transfer.playerInId,
          `Player In ${index + 1}`,
          clubInId,
          PlayerPosition.DEF,
          PlayerStatus.Available,
          new Prisma.Decimal("5.00"),
        ),
      ];
    });

    playerRepository.findByIds.mockResolvedValue(players);

    const result = await useCase.execute(userId, userTeamId, {
      gameweekId,
      transfers,
    });

    expect(result.transfersMade).toBe(4);

    expect(result.freeTransfersUsed).toBe(2);

    expect(result.paidTransfers).toBe(2);

    expect(result.pointsCost).toBe(8);

    expect(result.freeTransfersAfter).toBe(0);

    // sell 和 buy 都是 5，所以余额保持 25
    expect(result.budgetBalanceAfter.equals(new Prisma.Decimal("25.00"))).toBe(
      true,
    );
  });

  it("should execute a valid transfer batch successfully", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";

    const userTeamId = "22222222-2222-4222-8222-222222222222";

    const seasonId = "33333333-3333-4333-8333-333333333333";

    const gameweekId = "44444444-4444-4444-8444-444444444444";

    const playerOutId = "55555555-5555-4555-8555-555555555555";

    const playerInId = "66666666-6666-4666-8666-666666666666";

    const clubOutId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    const clubInId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

    const now = new Date("2026-09-05T17:00:00Z");

    jest.useFakeTimers();
    jest.setSystemTime(now);

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        new Prisma.Decimal("25.00"),
        0,
        2,
        new Date("2026-08-01T10:00:00Z"),
      ),
    );

    gameweekRepository.findById.mockResolvedValue(
      new GameweekEntity(
        gameweekId,
        seasonId,
        1,
        new Date("2026-09-05T18:00:00Z"), // deadlineAt
        new Date("2026-09-05T20:00:00Z"), // startsAt
        new Date("2026-09-07T23:00:00Z"), // endsAt
      ),
    );

    userTeamPlayerRepository.findActiveByUserTeamId.mockResolvedValue([
      new UserTeamPlayerEntity(
        "77777777-7777-4777-8777-777777777777",
        userTeamId,
        playerOutId,
        new Prisma.Decimal("7.00"),
        true,
        new Date("2026-08-01T10:00:00Z"),
        null,
        new SquadPlayerEntity(
          playerOutId,
          "Player Out",
          clubOutId,
          PlayerPosition.DEF,
          PlayerStatus.Available,
          new Prisma.Decimal("7.00"),
          new SquadPlayerClubEntity(clubOutId, "Club Out", "OUT"),
        ),
      ),
    ]);

    const playerOut = new PlayerEntity(
      playerOutId,
      "Player Out",
      clubOutId,
      PlayerPosition.DEF,
      PlayerStatus.Available,
      new Prisma.Decimal("7.00"),
    );

    const playerIn = new PlayerEntity(
      playerInId,
      "Player In",
      clubInId,
      PlayerPosition.DEF,
      PlayerStatus.Available,
      new Prisma.Decimal("8.00"),
    );

    playerRepository.findByIds.mockResolvedValue([playerOut, playerIn]);

    transferBatchRepository.executeConfirmedBatch.mockResolvedValue(
      new TransferBatchEntity(
        "88888888-8888-4888-8888-888888888888",
        userTeamId,
        gameweekId,
        TransferBatchStatus.Confirmed,
        now,
        now,
        1,
        0,
        new Prisma.Decimal("24.00"),
      ),
    );

    const input = {
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
        },
      ],
    };

    const result = await useCase.execute(userId, userTeamId, input);

    expect(userTeamRepository.findById).toHaveBeenCalledWith(userTeamId);

    expect(gameweekRepository.findById).toHaveBeenCalledWith(gameweekId);

    expect(
      userTeamPlayerRepository.findActiveByUserTeamId,
    ).toHaveBeenCalledWith(userTeamId);

    expect(playerRepository.findByIds).toHaveBeenCalledWith([
      playerOutId,
      playerInId,
    ]);

    expect(transferBatchRepository.executeConfirmedBatch).toHaveBeenCalledTimes(
      1,
    );

    const call = transferBatchRepository.executeConfirmedBatch.mock.calls[0][0];

    expect(call.userTeamId).toBe(userTeamId);
    expect(call.gameweekId).toBe(gameweekId);

    expect(call.transfersMade).toBe(1);
    expect(call.pointsCost).toBe(0);

    expect(call.freeTransfersUsed).toBe(1);
    expect(call.freeTransfersAfter).toBe(1);

    expect(call.budgetBalanceAfter.equals(new Prisma.Decimal("24.00"))).toBe(
      true,
    );

    expect(call.confirmedAt).toEqual(now);

    expect(call.transfers).toHaveLength(1);

    expect(call.transfers[0].playerOutId).toBe(playerOutId);

    expect(call.transfers[0].playerInId).toBe(playerInId);

    expect(call.transfers[0].sellPrice.equals(new Prisma.Decimal("7.00"))).toBe(
      true,
    );

    expect(call.transfers[0].buyPrice.equals(new Prisma.Decimal("8.00"))).toBe(
      true,
    );

    expect(result.transfersMade).toBe(1);
    expect(result.freeTransfersUsed).toBe(1);
    expect(result.paidTransfers).toBe(0);
    expect(result.pointsCost).toBe(0);
    expect(result.freeTransfersAfter).toBe(1);

    expect(result.budgetBalanceAfter.equals(new Prisma.Decimal("24.00"))).toBe(
      true,
    );
  });
});
