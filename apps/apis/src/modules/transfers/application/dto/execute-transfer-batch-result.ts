import { Prisma } from "@prisma/client";

export interface ExecuteTransferBatchResult {
  transfersMade: number;

  freeTransfersUsed: number;

  paidTransfers: number;

  pointsCost: number;

  freeTransfersAfter: number;

  budgetBalanceAfter: Prisma.Decimal;
}
