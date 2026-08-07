import { PlayerPosition, PlayerStatus } from '@prisma/client'

export class ClubSummaryResponseDto {
  clubId!: string
  name!: string
  shortName!: string | null
}

export class PlayerResponseDto {
  playerId!: string
  name!: string
  clubId!: string
  position!: PlayerPosition
  status!: PlayerStatus
  currentPrice!: string
  club!: ClubSummaryResponseDto | null
}