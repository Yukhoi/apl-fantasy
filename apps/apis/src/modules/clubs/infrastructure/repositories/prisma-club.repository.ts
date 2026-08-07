import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../prisma/prisma.service'
import { ClubEntity } from '../../domain/entities/club.entity'
import { ClubRepository } from '../../domain/repositories/club.repository'

@Injectable()
export class PrismaClubRepository implements ClubRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ClubEntity[]> {
    const clubs = await this.prisma.club.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return clubs.map(
      (club) =>
        new ClubEntity(
          club.clubId,
          club.name,
          club.shortName ?? null,
        ),
    )
  }

  async findById(clubId: string): Promise<ClubEntity | null> {
    const club = await this.prisma.club.findUnique({
      where: {
        clubId,
      },
    })

    if (!club) {
      return null
    }

    return new ClubEntity(
      club.clubId,
      club.name,
      club.shortName ?? null,
    )
  }
}