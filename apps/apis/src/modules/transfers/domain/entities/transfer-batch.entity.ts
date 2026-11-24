import { Prisma, TransferBatchStatus } from "@prisma/client";

export class TransferBatchEntity {
  constructor(
    public readonly transferBatchId: string,
    public readonly userTeamId: string,
    public readonly gameweekId: string,

    public readonly status: TransferBatchStatus,
    public readonly createdAt: Date,
    public readonly confirmedAt: Date | null,

    public readonly transfersMade: number,
    public readonly pointsCost: number,
    public readonly budgetBalanceAfter: Prisma.Decimal | null,
  ) {}
}
