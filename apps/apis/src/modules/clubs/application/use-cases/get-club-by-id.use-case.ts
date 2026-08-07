import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  CLUB_REPOSITORY,
  ClubRepository,
} from '../../domain/repositories/club.repository'
import { ClubResponseDto } from '../dto/club-response.dto'

@Injectable()
export class GetClubByIdUseCase {
  constructor(
    @Inject(CLUB_REPOSITORY)
    private readonly clubRepository: ClubRepository,
  ) {}

  async execute(clubId: string): Promise<ClubResponseDto> {
    const club = await this.clubRepository.findById(clubId)

    if (!club) {
      throw new NotFoundException(`Club with id "${clubId}" not found`)
    }

    return {
      clubId: club.clubId,
      name: club.name,
      shortName: club.shortName,
    }
  }
}