import { FixtureStatus } from '@prisma/client'

export class FixtureEntity {
  constructor(
    public readonly fixtureId: string,
    public readonly seasonId: string,
    public readonly gameweekId: string,
    public readonly homeClubId: string,
    public readonly awayClubId: string,
    public readonly kickoffAt: Date,
    public readonly status: FixtureStatus,
  ) {}
}