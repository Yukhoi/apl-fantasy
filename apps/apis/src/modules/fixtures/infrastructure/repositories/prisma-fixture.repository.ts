import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'
import { FixtureEntity } from '../../domain/entities/fixture.entity'
import {
  FindFixturesFilters,
  FixtureRepository,
} from '../../domain/repositories/fixture.repository'

@Injectable()
export class PrismaFixtureRepository implements FixtureRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: FindFixturesFilters): Promise<FixtureEntity[]> {
    const fixtures = await this.prisma.fixture.findMany({
      where: {
        seasonId: filters?.seasonId,
        gameweekId: filters?.gameweekId,
        status: filters?.status,
        ...(filters?.clubId
          ? {
              OR: [
                { homeClubId: filters.clubId },
                { awayClubId: filters.clubId },
              ],
            }
          : {}),
      },
      orderBy: [{ kickoffAt: 'asc' }],
    })

    return fixtures.map(
      (fixture) =>
        new FixtureEntity(
          fixture.fixtureId,
          fixture.seasonId,
          fixture.gameweekId,
          fixture.homeClubId,
          fixture.awayClubId,
          fixture.kickoffAt,
          fixture.status,
        ),
    )
  }

  async findById(fixtureId: string): Promise<FixtureEntity | null> {
    const fixture = await this.prisma.fixture.findUnique({
      where: {
        fixtureId,
      },
    })

    if (!fixture) {
      return null
    }

    return new FixtureEntity(
      fixture.fixtureId,
      fixture.seasonId,
      fixture.gameweekId,
      fixture.homeClubId,
      fixture.awayClubId,
      fixture.kickoffAt,
      fixture.status,
    )
  }
}