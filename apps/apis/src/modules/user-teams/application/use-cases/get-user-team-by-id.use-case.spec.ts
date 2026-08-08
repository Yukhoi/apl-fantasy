import {
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { GetUserTeamByIdUseCase } from "./get-user-team-by-id.use-case";
import { UserTeamRepository } from "../../domain/repositories/user-team.repository";
import { UserTeamEntity } from "../../domain/entities/user-team.entity";

describe("GetUserTeamByIdUseCase", () => {
  let useCase: GetUserTeamByIdUseCase;
  let userTeamRepository: jest.Mocked<UserTeamRepository>;

  beforeEach(() => {
    userTeamRepository = {
      findById: jest.fn(),
      findByUserAndSeason: jest.fn(),
      create: jest.fn(),
    };

    useCase = new GetUserTeamByIdUseCase(userTeamRepository);
  });

  it("should return the user team when it exists and belongs to the current user", async () => {
    // Arrange
    const userId = "11111111-1111-1111-1111-111111111111";
    const userTeamId = "22222222-2222-2222-2222-222222222222";
    const seasonId = "33333333-3333-3333-3333-333333333333";
    const createdAt = new Date("2026-08-09T10:00:00.000Z");

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
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
    const result = await useCase.execute(userId, userTeamId);

    // Assert
    expect(userTeamRepository.findById).toHaveBeenCalledWith(userTeamId);
    expect(userTeamRepository.findById).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      userTeamId,
      userId,
      seasonId,
      teamName: "Yukhoi FC",
      budgetLimit: "100.00",
      totalPoints: 42,
      freeTransfers: 2,
      createdAt: "2026-08-09T10:00:00.000Z",
    });
  });

  it("should throw NotFoundException when the user team does not exist", async () => {
    // Arrange
    const userId = "11111111-1111-1111-1111-111111111111";
    const userTeamId = "22222222-2222-2222-2222-222222222222";

    userTeamRepository.findById.mockResolvedValue(null);

    // Act + Assert
    await expect(
      useCase.execute(userId, userTeamId),
    ).rejects.toThrow(NotFoundException);

    expect(userTeamRepository.findById).toHaveBeenCalledWith(userTeamId);

    expect(
      userTeamRepository.findByUserAndSeason,
    ).not.toHaveBeenCalled();

    expect(userTeamRepository.create).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenException when the user team belongs to another user", async () => {
    // Arrange
    const currentUserId =
      "11111111-1111-1111-1111-111111111111";

    const ownerUserId =
      "99999999-9999-9999-9999-999999999999";

    const userTeamId =
      "22222222-2222-2222-2222-222222222222";

    const seasonId =
      "33333333-3333-3333-3333-333333333333";

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        ownerUserId,
        seasonId,
        "Other User FC",
        new Prisma.Decimal("100.00"),
        100,
        1,
        new Date(),
      ),
    );

    // Act + Assert
    await expect(
      useCase.execute(currentUserId, userTeamId),
    ).rejects.toThrow(ForbiddenException);

    expect(userTeamRepository.findById).toHaveBeenCalledWith(userTeamId);
  });

  it("should not call other repository methods", async () => {
    // Arrange
    const userId = "11111111-1111-1111-1111-111111111111";
    const userTeamId = "22222222-2222-2222-2222-222222222222";

    userTeamRepository.findById.mockResolvedValue(
      new UserTeamEntity(
        userTeamId,
        userId,
        "33333333-3333-3333-3333-333333333333",
        "Yukhoi FC",
        new Prisma.Decimal("100.00"),
        0,
        3,
        new Date(),
      ),
    );

    // Act
    await useCase.execute(userId, userTeamId);

    // Assert
    expect(
      userTeamRepository.findByUserAndSeason,
    ).not.toHaveBeenCalled();

    expect(userTeamRepository.create).not.toHaveBeenCalled();
  });
});