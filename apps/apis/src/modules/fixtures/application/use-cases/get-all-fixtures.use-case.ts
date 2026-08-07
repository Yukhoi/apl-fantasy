import { Inject, Injectable } from '@nestjs/common'
import {
  FindFixturesFilters,
  FIXTURE_REPOSITORY,
  FixtureRepository,
} from '../../domain/repositories/fixture.repository'
import { FixtureResponseDto } from '../dto/fixture-response.dto'

@Injectable()
export class GetAllFixturesUseCase {
  constructor(
    @Inject(FIXTURE_REPOSITORY)
    private readonly fixtureRepository: FixtureRepository,
  ) {}

  async execute(filters?: FindFixturesFilters): Promise<FixtureResponseDto[]> {
    const fixtures = await this.fixtureRepository.findAll(filters)

    return fixtures.map((fixture) => ({
      fixtureId: fixture.fixtureId,
      seasonId: fixture.seasonId,
      gameweekId: fixture.gameweekId,
      homeClubId: fixture.homeClubId,
      awayClubId: fixture.awayClubId,
      kickoffAt: fixture.kickoffAt.toISOString(),
      status: fixture.status,
    }))
  }
}