import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common'
import { GetAllFixturesUseCase } from '../../application/use-cases/get-all-fixtures.use-case'
import { GetFixtureByIdUseCase } from '../../application/use-cases/get-fixture-by-id.use-case'
import { GetFixturesQueryDto } from '../../application/dto/get-fixtures-query.dto'
import { FixtureResponseDto } from '../../application/dto/fixture-response.dto'

@Controller('fixtures')
export class FixturesController {
  constructor(
    private readonly getAllFixturesUseCase: GetAllFixturesUseCase,
    private readonly getFixtureByIdUseCase: GetFixtureByIdUseCase,
  ) {}

  @Get()
  async findAll(
    @Query() query: GetFixturesQueryDto,
  ): Promise<FixtureResponseDto[]> {
    return this.getAllFixturesUseCase.execute({
      seasonId: query.seasonId,
      gameweekId: query.gameweekId,
      clubId: query.clubId,
      status: query.status,
    })
  }

  @Get(':fixtureId')
  async findById(
    @Param('fixtureId', new ParseUUIDPipe()) fixtureId: string,
  ): Promise<FixtureResponseDto> {
    return this.getFixtureByIdUseCase.execute(fixtureId)
  }
}