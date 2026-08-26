import { Prisma } from "@prisma/client";

export class UserTeamEntity {
  constructor(
    public readonly userTeamId: string,
    public readonly userId: string,
    public readonly seasonId: string,
    public readonly teamName: string,
    public readonly budgetLimit: Prisma.Decimal,
    public readonly budgetBalance: Prisma.Decimal,
    public readonly totalPoints: number,
    public readonly freeTransfers: number,
    public readonly createdAt: Date,
  ) {}
}
