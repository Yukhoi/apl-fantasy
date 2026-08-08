import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateUserTeamUseCase } from "./create-user-team.use-case";
import { UserTeamRepository } from "../../domain/repositories/user-team.repository";
import { UserTeamEntity } from "../../domain/entities/user-team.entity";
import {
  INITIAL_BUDGET,
  INITIAL_FREE_TRANSFERS,
} from "../../domain/constants/user-team-rules";
import { GetSeasonByIdUseCase } from "../../../seasons/application/use-cases/get-season-by-id.use-case";

describe("CreateUserTeamUseCase", () => {
  let useCase: CreateUserTeamUseCase;
  let userTeamRepository: jest.Mocked<UserTeamRepository>;
  let getSeasonByIdUseCase: jest.Mocked<GetSeasonByIdUseCase>;

  beforeEach(() => {
    userTeamRepository = {
      findById: jest.fn(),
      findByUserAndSeason: jest.fn(),
      create: jest.fn(),
    };

    getSeasonByIdUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetSeasonByIdUseCase>;

    useCase = new CreateUserTeamUseCase(
      userTeamRepository,
      getSeasonByIdUseCase,
    );
  });

  it("should create a user team successfully", async () => {
    // Arrange
    const userId = "11111111-1111-1111-1111-111111111111";
    const seasonId = "22222222-2222-2222-2222-222222222222";

    const input = {
      seasonId,
      teamName: "Yukhoi FC",
    };

    getSeasonByIdUseCase.execute.mockResolvedValue({
      seasonId,
      name: "2026/27",
      startDate: "2026-08-01T00:00:00.000Z",
      endDate: "2027-05-31T00:00:00.000Z",
      status: "Active" as any,
    });

    userTeamRepository.findByUserAndSeason.mockResolvedValue(null);

    const createdAt = new Date("2026-08-09T10:00:00.000Z");

    const createdTeam = new UserTeamEntity(
      "33333333-3333-3333-3333-333333333333",
      userId,
      seasonId,
      "Yukhoi FC",
      new Prisma.Decimal(INITIAL_BUDGET),
      0,
      INITIAL_FREE_TRANSFERS,
      createdAt,
    );

    userTeamRepository.create.mockResolvedValue(createdTeam);

    // Act
    const result = await useCase.execute(userId, input);

    // Assert
    expect(getSeasonByIdUseCase.execute).toHaveBeenCalledWith(seasonId);

    expect(userTeamRepository.findByUserAndSeason).toHaveBeenCalledWith(
      userId,
      seasonId,
    );

    expect(userTeamRepository.create).toHaveBeenCalledWith({
      userId,
      seasonId,
      teamName: "Yukhoi FC",
      budgetLimit: INITIAL_BUDGET,
      freeTransfers: INITIAL_FREE_TRANSFERS,
    });

    expect(result).toEqual({
      userTeamId: "33333333-3333-3333-3333-333333333333",
      userId,
      seasonId,
      teamName: "Yukhoi FC",
      budgetLimit: INITIAL_BUDGET,
      totalPoints: 0,
      freeTransfers: INITIAL_FREE_TRANSFERS,
      createdAt: createdAt.toISOString(),
    });
  });

  it("should throw ConflictException when user already has a team for the season", async () => {
    // Arrange
    const userId = "11111111-1111-1111-1111-111111111111";
    const seasonId = "22222222-2222-2222-2222-222222222222";

    getSeasonByIdUseCase.execute.mockResolvedValue({} as any);

    userTeamRepository.findByUserAndSeason.mockResolvedValue(
      new UserTeamEntity(
        "33333333-3333-3333-3333-333333333333",
        userId,
        seasonId,
        "Existing FC",
        new Prisma.Decimal(INITIAL_BUDGET),
        0,
        INITIAL_FREE_TRANSFERS,
        new Date(),
      ),
    );

    // Act + Assert
    await expect(
      useCase.execute(userId, {
        seasonId,
        teamName: "New FC",
      }),
    ).rejects.toThrow(ConflictException);

    expect(userTeamRepository.create).not.toHaveBeenCalled();
  });

  it("should propagate NotFoundException when season does not exist", async () => {
    // Arrange
    const userId = "11111111-1111-1111-1111-111111111111";
    const seasonId = "22222222-2222-2222-2222-222222222222";

    getSeasonByIdUseCase.execute.mockRejectedValue(
      new NotFoundException("Season not found"),
    );

    // Act + Assert
    await expect(
      useCase.execute(userId, {
        seasonId,
        teamName: "Yukhoi FC",
      }),
    ).rejects.toThrow(NotFoundException);

    expect(
      userTeamRepository.findByUserAndSeason,
    ).not.toHaveBeenCalled();

    expect(userTeamRepository.create).not.toHaveBeenCalled();
  });

  it("should use initial budget and initial free transfers", async () => {
    // Arrange
    const userId = "11111111-1111-1111-1111-111111111111";
    const seasonId = "22222222-2222-2222-2222-222222222222";

    getSeasonByIdUseCase.execute.mockResolvedValue({} as any);

    userTeamRepository.findByUserAndSeason.mockResolvedValue(null);

    userTeamRepository.create.mockResolvedValue(
      new UserTeamEntity(
        "33333333-3333-3333-3333-333333333333",
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal(INITIAL_BUDGET),
        0,
        INITIAL_FREE_TRANSFERS,
        new Date(),
      ),
    );

    // Act
    await useCase.execute(userId, {
      seasonId,
      teamName: "Yukhoi FC",
    });

    // Assert
    expect(userTeamRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        budgetLimit: INITIAL_BUDGET,
        freeTransfers: INITIAL_FREE_TRANSFERS,
      }),
    );
  });
});