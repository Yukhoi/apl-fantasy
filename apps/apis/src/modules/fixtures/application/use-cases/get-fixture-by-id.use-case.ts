import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  FIXTURE_REPOSITORY,
  FixtureRepository,
} from '../../domain/repositories/fixture.repository'
import { FixtureResponseDto } from '../dto/fixture-response.dto'

@Injectable()
export class GetFixtureByIdUseCase {
  constructor(
    @Inject(FIXTURE_REPOSITORY)
    private readonly fixtureRepository: FixtureRepository,
  ) {}

  async execute(fixtureId: string): Promise<FixtureResponseDto> {
    const fixture = await this.fixtureRepository.findById(fixtureId)

    if (!fixture) {
      throw new NotFoundException(`Fixture with id "${fixtureId}" not found`)
    }

    return {
      fixtureId: fixture.fixtureId,
      seasonId: fixture.seasonId,
      gameweekId: fixture.gameweekId,
      homeClubId: fixture.homeClubId,
      awayClubId: fixture.awayClubId,
      kickoffAt: fixture.kickoffAt.toISOString(),
      status: fixture.status,
    }
  }
}