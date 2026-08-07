import { Module } from '@nestjs/common'
import { FixturesController } from './presentation/controllers/fixtures.controller'
import { GetAllFixturesUseCase } from './application/use-cases/get-all-fixtures.use-case'
import { GetFixtureByIdUseCase } from './application/use-cases/get-fixture-by-id.use-case'
import { FIXTURE_REPOSITORY } from './domain/repositories/fixture.repository'
import { PrismaFixtureRepository } from './infrastructure/repositories/prisma-fixture.repository'

@Module({
  controllers: [FixturesController],
  providers: [
    GetAllFixturesUseCase,
    GetFixtureByIdUseCase,
    {
      provide: FIXTURE_REPOSITORY,
      useClass: PrismaFixtureRepository,
    },
  ],
})
export class FixturesModule {}