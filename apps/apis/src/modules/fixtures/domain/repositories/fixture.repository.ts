import { FixtureStatus } from '@prisma/client'
import { FixtureEntity } from '../entities/fixture.entity'

export const FIXTURE_REPOSITORY = 'FIXTURE_REPOSITORY'

export type FindFixturesFilters = {
  seasonId?: string
  gameweekId?: string
  clubId?: string
  status?: FixtureStatus
}

export interface FixtureRepository {
  findAll(filters?: FindFixturesFilters): Promise<FixtureEntity[]>
  findById(fixtureId: string): Promise<FixtureEntity | null>
}