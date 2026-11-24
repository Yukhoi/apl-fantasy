import { Prisma, TransferBatchStatus, LedgerRefType } from "@prisma/client";

import { PrismaTransferBatchRepository } from "./prisma-transfer-batch.repository";

import { PrismaService } from "../../../../prisma/prisma.service";
import { ExecuteTransferBatchData } from "../../domain/repositories/transfer-batch.repository";

describe("PrismaTransferBatchRepository", () => {
  let repository: PrismaTransferBatchRepository;

  const userTeamId = "11111111-1111-4111-8111-111111111111";

  const gameweekId = "22222222-2222-4222-8222-222222222222";

  const playerOutId = "33333333-3333-4333-8333-333333333333";

  const playerInId = "44444444-4444-4444-8444-444444444444";

  const transferBatchId = "55555555-5555-4555-8555-555555555555";

  const confirmedAt = new Date("2026-09-05T17:59:00Z");

  const mockTransaction = {
    transferBatch: {
      create: jest.fn(),
    },
    transfer: {
      createMany: jest.fn(),
    },
    userTeamPlayer: {
      updateMany: jest.fn(),
      createMany: jest.fn(),
    },
    userTeam: {
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    transferCreditLedger: {
      create: jest.fn(),
    },
  };

  const prisma = {
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.$transaction.mockImplementation(
      async (callback: (tx: typeof mockTransaction) => Promise<unknown>) =>
        callback(mockTransaction),
    );

    mockTransaction.userTeamPlayer.updateMany.mockResolvedValue({
      count: 1,
    });

    mockTransaction.userTeamPlayer.createMany.mockResolvedValue({
      count: 1,
    });

    mockTransaction.userTeam.updateMany.mockResolvedValue({
      count: 1,
    });

    mockTransaction.transferCreditLedger.create.mockResolvedValue({
      ledgerId: "66666666-6666-4666-8666-666666666666",
    });

    repository = new PrismaTransferBatchRepository(
      prisma as unknown as PrismaService,
    );
  });

  it("should create a confirmed transfer batch and its transfers", async () => {
    // Arrange
    mockTransaction.transferBatch.create.mockResolvedValue({
      transferBatchId,
      userTeamId,
      gameweekId,
      status: TransferBatchStatus.Confirmed,
      createdAt: confirmedAt,
      confirmedAt,
      transfersMade: 1,
      pointsCost: 0,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
    });

    mockTransaction.transfer.createMany.mockResolvedValue({
      count: 1,
    });

    const data: ExecuteTransferBatchData = {
      userTeamId,
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
          sellPrice: new Prisma.Decimal("7.00"),
          buyPrice: new Prisma.Decimal("8.00"),
        },
      ],
      transfersMade: 1,
      pointsCost: 0,
      freeTransfersUsed: 1,
      freeTransfersAfter: 1,
      expectedBudgetBalance: new Prisma.Decimal("25.00"),
      expectedFreeTransfers: 2,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
      confirmedAt,
    };

    // Act
    await repository.executeConfirmedBatch(data);

    // Assert
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    expect(mockTransaction.transferBatch.create).toHaveBeenCalledWith({
      data: {
        userTeamId,
        gameweekId,
        status: TransferBatchStatus.Confirmed,
        confirmedAt,
        transfersMade: 1,
        pointsCost: 0,
        budgetBalanceAfter: new Prisma.Decimal("24.00"),
      },
    });

    expect(mockTransaction.transfer.createMany).toHaveBeenCalledWith({
      data: [
        {
          transferBatchId,
          playerOutId,
          playerInId,
          sellPrice: new Prisma.Decimal("7.00"),
          buyPrice: new Prisma.Decimal("8.00"),
        },
      ],
    });
  });

  it("should deactivate outgoing players and add incoming players", async () => {
    // Arrange
    mockTransaction.transferBatch.create.mockResolvedValue({
      transferBatchId,
      userTeamId,
      gameweekId,
      status: TransferBatchStatus.Confirmed,
      createdAt: confirmedAt,
      confirmedAt,
      transfersMade: 1,
      pointsCost: 0,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
    });

    mockTransaction.transfer.createMany.mockResolvedValue({
      count: 1,
    });

    mockTransaction.userTeamPlayer.updateMany.mockResolvedValue({
      count: 1,
    });

    mockTransaction.userTeamPlayer.createMany.mockResolvedValue({
      count: 1,
    });

    const data: ExecuteTransferBatchData = {
      userTeamId,
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
          sellPrice: new Prisma.Decimal("7.00"),
          buyPrice: new Prisma.Decimal("8.00"),
        },
      ],
      transfersMade: 1,
      pointsCost: 0,
      freeTransfersUsed: 1,
      freeTransfersAfter: 1,
      expectedBudgetBalance: new Prisma.Decimal("25.00"),
      expectedFreeTransfers: 2,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
      confirmedAt,
    };

    // Act
    await repository.executeConfirmedBatch(data);

    // Assert: 卖出球员必须退出 active squad
    expect(mockTransaction.userTeamPlayer.updateMany).toHaveBeenCalledWith({
      where: {
        userTeamId,
        playerId: playerOutId,
        isActive: true,
      },
      data: {
        isActive: false,
        leftAt: confirmedAt,
      },
    });

    // Assert: 买入球员必须加入 active squad
    expect(mockTransaction.userTeamPlayer.createMany).toHaveBeenCalledWith({
      data: [
        {
          userTeamId,
          playerId: playerInId,
          purchasePrice: new Prisma.Decimal("8.00"),
          isActive: true,
          joinedAt: confirmedAt,
        },
      ],
    });
  });

  it("should update user team budget and free transfers after a confirmed batch", async () => {
    // Arrange
    mockTransaction.transferBatch.create.mockResolvedValue({
      transferBatchId,
      userTeamId,
      gameweekId,
      status: TransferBatchStatus.Confirmed,
      createdAt: confirmedAt,
      confirmedAt,
      transfersMade: 1,
      pointsCost: 0,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
    });

    mockTransaction.transfer.createMany.mockResolvedValue({
      count: 1,
    });

    const data: ExecuteTransferBatchData = {
      userTeamId,
      gameweekId,

      transfers: [
        {
          playerOutId,
          playerInId,
          sellPrice: new Prisma.Decimal("7.00"),
          buyPrice: new Prisma.Decimal("8.00"),
        },
      ],

      transfersMade: 1,
      pointsCost: 0,

      freeTransfersUsed: 1,
      freeTransfersAfter: 1,

      expectedBudgetBalance: new Prisma.Decimal("25.00"),
      expectedFreeTransfers: 2,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
      confirmedAt,
    };

    // Act
    await repository.executeConfirmedBatch(data);

    // Assert
    expect(mockTransaction.userTeam.updateMany).toHaveBeenCalledTimes(1);

    expect(mockTransaction.userTeam.updateMany).toHaveBeenCalledWith({
      where: {
        userTeamId,
        budgetBalance: new Prisma.Decimal("25.00"),
        freeTransfers: 2,
      },
      data: {
        budgetBalance: new Prisma.Decimal("24.00"),
        freeTransfers: 1,
      },
    });
  });

  it("should record consumed free transfers in the transfer credit ledger", async () => {
    // Arrange
    mockTransaction.transferBatch.create.mockResolvedValue({
      transferBatchId,
      userTeamId,
      gameweekId,
      status: TransferBatchStatus.Confirmed,
      createdAt: confirmedAt,
      confirmedAt,
      transfersMade: 1,
      pointsCost: 0,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
    });

    mockTransaction.transfer.createMany.mockResolvedValue({
      count: 1,
    });

    mockTransaction.userTeamPlayer.updateMany.mockResolvedValue({
      count: 1,
    });

    mockTransaction.userTeamPlayer.createMany.mockResolvedValue({
      count: 1,
    });

    mockTransaction.userTeam.update.mockResolvedValue({});

    const data: ExecuteTransferBatchData = {
      userTeamId,
      gameweekId,

      transfers: [
        {
          playerOutId,
          playerInId,
          sellPrice: new Prisma.Decimal("7.00"),
          buyPrice: new Prisma.Decimal("8.00"),
        },
      ],

      transfersMade: 1,
      pointsCost: 0,

      freeTransfersUsed: 1,
      freeTransfersAfter: 1,

      expectedBudgetBalance: new Prisma.Decimal("25.00"),
      expectedFreeTransfers: 2,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
      confirmedAt,
    };

    // Act
    await repository.executeConfirmedBatch(data);

    // Assert
    expect(mockTransaction.transferCreditLedger.create).toHaveBeenCalledTimes(
      1,
    );

    expect(mockTransaction.transferCreditLedger.create).toHaveBeenCalledWith({
      data: {
        userTeamId,
        gameweekId,
        delta: -1,
        reason: "TRANSFER_USAGE",
        refType: LedgerRefType.TransferBatch,
        refId: transferBatchId,
      },
    });
  });

  it("should not create a transfer credit ledger when no free transfers are used", async () => {
    // Arrange
    mockTransaction.transferBatch.create.mockResolvedValue({
      transferBatchId,
      userTeamId,
      gameweekId,
      status: TransferBatchStatus.Confirmed,
      createdAt: confirmedAt,
      confirmedAt,
      transfersMade: 1,
      pointsCost: 4,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
    });

    const data: ExecuteTransferBatchData = {
      userTeamId,
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
          sellPrice: new Prisma.Decimal("7.00"),
          buyPrice: new Prisma.Decimal("8.00"),
        },
      ],
      transfersMade: 1,
      pointsCost: 4,
      freeTransfersUsed: 0,
      freeTransfersAfter: 0,
      expectedBudgetBalance: new Prisma.Decimal("25.00"),
      expectedFreeTransfers: 0,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
      confirmedAt,
    };

    // Act
    await repository.executeConfirmedBatch(data);

    // Assert
    expect(mockTransaction.transferCreditLedger.create).not.toHaveBeenCalled();

    expect(mockTransaction.transferBatch.create).toHaveBeenCalledWith({
      data: {
        userTeamId,
        gameweekId,
        status: TransferBatchStatus.Confirmed,
        confirmedAt,
        transfersMade: 1,
        pointsCost: 4,
        budgetBalanceAfter: new Prisma.Decimal("24.00"),
      },
    });
  });

  it("should reject the batch when an outgoing player is no longer active", async () => {
    // Arrange
    mockTransaction.transferBatch.create.mockResolvedValue({
      transferBatchId,
      userTeamId,
      gameweekId,
      status: TransferBatchStatus.Confirmed,
      createdAt: confirmedAt,
      confirmedAt,
      transfersMade: 1,
      pointsCost: 0,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
    });

    mockTransaction.userTeamPlayer.updateMany.mockResolvedValueOnce({
      count: 0,
    });

    const data: ExecuteTransferBatchData = {
      userTeamId,
      gameweekId,
      transfers: [
        {
          playerOutId,
          playerInId,
          sellPrice: new Prisma.Decimal("7.00"),
          buyPrice: new Prisma.Decimal("8.00"),
        },
      ],
      transfersMade: 1,
      pointsCost: 0,
      freeTransfersUsed: 1,
      freeTransfersAfter: 1,
      expectedBudgetBalance: new Prisma.Decimal("25.00"),
      expectedFreeTransfers: 2,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
      confirmedAt,
    };

    // Act + Assert
    await expect(repository.executeConfirmedBatch(data)).rejects.toThrow(
      `Failed to deactivate outgoing player ${playerOutId}`,
    );

    expect(mockTransaction.userTeamPlayer.createMany).not.toHaveBeenCalled();

    expect(mockTransaction.userTeam.update).not.toHaveBeenCalled();

    expect(mockTransaction.transferCreditLedger.create).not.toHaveBeenCalled();
  });

  it("should reject a transfer batch when user team state has changed concurrently", async () => {
    // Arrange
    mockTransaction.transferBatch.create.mockResolvedValue({
      transferBatchId,
      userTeamId,
      gameweekId,
      status: TransferBatchStatus.Confirmed,
      createdAt: confirmedAt,
      confirmedAt,
      transfersMade: 1,
      pointsCost: 0,
      budgetBalanceAfter: new Prisma.Decimal("24.00"),
    });

    mockTransaction.transfer.createMany.mockResolvedValue({
      count: 1,
    });

    mockTransaction.userTeamPlayer.updateMany.mockResolvedValue({
      count: 1,
    });

    mockTransaction.userTeamPlayer.createMany.mockResolvedValue({
      count: 1,
    });

    // 模拟并发冲突：
    // UserTeam 的预算或免费转会次数已经被其他请求修改
    mockTransaction.userTeam.updateMany.mockResolvedValue({
      count: 0,
    });

    const data: ExecuteTransferBatchData = {
      userTeamId,
      gameweekId,

      transfers: [
        {
          playerOutId,
          playerInId,
          sellPrice: new Prisma.Decimal("7.00"),
          buyPrice: new Prisma.Decimal("8.00"),
        },
      ],

      transfersMade: 1,
      pointsCost: 0,

      freeTransfersUsed: 1,
      freeTransfersAfter: 1,

      expectedBudgetBalance: new Prisma.Decimal("25.00"),
      expectedFreeTransfers: 2,

      budgetBalanceAfter: new Prisma.Decimal("24.00"),
      confirmedAt,
    };

    // Act + Assert
    await expect(repository.executeConfirmedBatch(data)).rejects.toThrow(
      "User team state has changed concurrently",
    );

    // 必须尝试使用旧状态作为条件进行更新
    expect(mockTransaction.userTeam.updateMany).toHaveBeenCalledWith({
      where: {
        userTeamId,
        budgetBalance: new Prisma.Decimal("25.00"),
        freeTransfers: 2,
      },
      data: {
        budgetBalance: new Prisma.Decimal("24.00"),
        freeTransfers: 1,
      },
    });

    // 并发冲突后，不能继续写入 Ledger
    expect(mockTransaction.transferCreditLedger.create).not.toHaveBeenCalled();
  });
});
