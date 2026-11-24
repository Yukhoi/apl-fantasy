import { Prisma } from "@prisma/client";

export class TransferEntity {
  constructor(
    public readonly transferId: string,
    public readonly transferBatchId: string,

    public readonly playerOutId: string,
    public readonly playerInId: string,

    public readonly sellPrice: Prisma.Decimal,
    public readonly buyPrice: Prisma.Decimal,
  ) {}
}