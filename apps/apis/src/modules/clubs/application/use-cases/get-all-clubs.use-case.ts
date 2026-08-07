import { Inject, Injectable } from '@nestjs/common'
import {
  CLUB_REPOSITORY,
  ClubRepository,
} from '../../domain/repositories/club.repository'
import { ClubResponseDto } from '../dto/club-response.dto'

@Injectable()
export class GetAllClubsUseCase {
  constructor(
    @Inject(CLUB_REPOSITORY)
    private readonly clubRepository: ClubRepository,
  ) {}

  async execute(): Promise<ClubResponseDto[]> {
    const clubs = await this.clubRepository.findAll()

    return clubs.map((club) => ({
      clubId: club.clubId,
      name: club.name,
      shortName: club.shortName,
    }))
  }
}