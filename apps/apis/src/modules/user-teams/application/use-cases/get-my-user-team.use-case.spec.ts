import { NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { GetMyUserTeamUseCase } from "./get-my-user-team.use-case";
import { UserTeamRepository } from "../../domain/repositories/user-team.repository";
import { UserTeamEntity } from "../../domain/entities/user-team.entity";

describe("GetMyUserTeamUseCase", () => {
  let useCase: GetMyUserTeamUseCase;
  let userTeamRepository: jest.Mocked<UserTeamRepository>;

  beforeEach(() => {
    userTeamRepository = {
      findById: jest.fn(),
      findByUserAndSeason: jest.fn(),
      create: jest.fn(),
    };

    useCase = new GetMyUserTeamUseCase(userTeamRepository);
  });

  it("should return the user's team for the given season", async () => {
    // Arrange
    const userId = "11111111-1111-1111-1111-111111111111";
    const seasonId = "22222222-2222-2222-2222-222222222222";
    const createdAt = new Date("2026-08-09T10:00:00.000Z");

    userTeamRepository.findByUserAndSeason.mockResolvedValue(
      new UserTeamEntity(
        "33333333-3333-3333-3333-333333333333",
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        42,
        2,
        createdAt,
      ),
    );

    // Act
    const result = await useCase.execute(userId, seasonId);

    // Assert
    expect(userTeamRepository.findByUserAndSeason).toHaveBeenCalledWith(
      userId,
      seasonId,
    );

    expect(result).toEqual({
      userTeamId: "33333333-3333-3333-3333-333333333333",
      userId,
      seasonId,
      teamName: "Yukhoi FC",
      budgetLimit: "100.00",
      totalPoints: 42,
      freeTransfers: 2,
      createdAt: "2026-08-09T10:00:00.000Z",
    });
  });

  it("should throw NotFoundException when user has no team for the season", async () => {
    // Arrange
    const userId = "11111111-1111-1111-1111-111111111111";
    const seasonId = "22222222-2222-2222-2222-222222222222";

    userTeamRepository.findByUserAndSeason.mockResolvedValue(null);

    // Act + Assert
    await expect(
      useCase.execute(userId, seasonId),
    ).rejects.toThrow(NotFoundException);

    expect(userTeamRepository.findByUserAndSeason).toHaveBeenCalledWith(
      userId,
      seasonId,
    );
  });

  it("should not call other repository methods", async () => {
    // Arrange
    const userId = "11111111-1111-1111-1111-111111111111";
    const seasonId = "22222222-2222-2222-2222-222222222222";

    userTeamRepository.findByUserAndSeason.mockResolvedValue(
      new UserTeamEntity(
        "33333333-3333-3333-3333-333333333333",
        userId,
        seasonId,
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date(),
      ),
    );

    // Act
    await useCase.execute(userId, seasonId);

    // Assert
    expect(userTeamRepository.findById).not.toHaveBeenCalled();
    expect(userTeamRepository.create).not.toHaveBeenCalled();
  });
});