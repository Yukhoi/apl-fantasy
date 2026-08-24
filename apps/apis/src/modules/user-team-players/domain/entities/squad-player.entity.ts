import { Prisma, PlayerPosition, PlayerStatus } from "@prisma/client";

export class SquadPlayerClubEntity {
  constructor(
    public readonly clubId: string,
    public readonly name: string,
    public readonly shortName: string | null,
  ) {}
}

export class SquadPlayerEntity {
  constructor(
    public readonly playerId: string,
    public readonly name: string,
    public readonly clubId: string,
    public readonly position: PlayerPosition,
    public readonly status: PlayerStatus,
    public readonly currentPrice: Prisma.Decimal,
    public readonly club: SquadPlayerClubEntity,
  ) {}
}