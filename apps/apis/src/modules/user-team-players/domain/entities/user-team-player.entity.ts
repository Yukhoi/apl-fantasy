import { Prisma } from "@prisma/client";
import { SquadPlayerEntity } from "./squad-player.entity";

export class UserTeamPlayerEntity {
  constructor(
    public readonly userTeamPlayerId: string,
    public readonly userTeamId: string,
    public readonly playerId: string,
    public readonly purchasePrice: Prisma.Decimal,
    public readonly isActive: boolean,
    public readonly joinedAt: Date,
    public readonly leftAt: Date | null,

    public readonly player?: SquadPlayerEntity,
  ) {}
}