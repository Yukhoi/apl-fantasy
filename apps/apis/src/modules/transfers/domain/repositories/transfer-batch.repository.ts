import { Prisma } from "@prisma/client";
import { TransferBatchEntity } from "../entities/transfer-batch.entity";

export const TRANSFER_BATCH_REPOSITORY = "TRANSFER_BATCH_REPOSITORY";

export interface ExecuteTransferData {
  playerOutId: string;
  playerInId: string;
  sellPrice: Prisma.Decimal;
  buyPrice: Prisma.Decimal;
}

export interface ExecuteTransferBatchData {
  userTeamId: string;
  gameweekId: string;

  transfers: ExecuteTransferData[];

  transfersMade: number;
  pointsCost: number;

  freeTransfersUsed: number;
  freeTransfersAfter: number;

  expectedBudgetBalance: Prisma.Decimal;
  expectedFreeTransfers: number;

  budgetBalanceAfter: Prisma.Decimal;
  confirmedAt: Date;
}

export interface TransferBatchRepository {
  executeConfirmedBatch(
    data: ExecuteTransferBatchData,
  ): Promise<TransferBatchEntity>;
}
