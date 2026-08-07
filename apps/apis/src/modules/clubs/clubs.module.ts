import { Module } from '@nestjs/common'
import { ClubsController } from './presentation/controllers/clubs.controller'
import { GetAllClubsUseCase } from './application/use-cases/get-all-clubs.use-case'
import {
  CLUB_REPOSITORY,
} from './domain/repositories/club.repository'
import { PrismaClubRepository } from './infrastructure/repositories/prisma-club.repository'
import { GetClubByIdUseCase } from './application/use-cases/get-club-by-id.use-case'

@Module({
  controllers: [ClubsController],
  providers: [
    GetAllClubsUseCase,
    GetClubByIdUseCase,
    {
      provide: CLUB_REPOSITORY,
      useClass: PrismaClubRepository,
    },
  ],
})
export class ClubsModule {}