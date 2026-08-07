import { FixtureStatus } from '@prisma/client'

export class FixtureResponseDto {
  fixtureId!: string
  seasonId!: string
  gameweekId!: string
  homeClubId!: string
  awayClubId!: string
  kickoffAt!: string
  status!: FixtureStatus
}