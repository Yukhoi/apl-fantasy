import { PlayerPosition, PlayerStatus, Prisma } from '@prisma/client'
import { ClubSummaryEntity } from './club-summary.entity'

export class PlayerEntity {
  constructor(
    public readonly playerId: string,
    public readonly name: string,
    public readonly clubId: string,
    public readonly position: PlayerPosition,
    public readonly status: PlayerStatus,
    public readonly currentPrice: Prisma.Decimal,
    public readonly club?: ClubSummaryEntity,
  ) {}
}