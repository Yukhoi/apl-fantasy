import { ClubEntity } from '../entities/club.entity'

export const CLUB_REPOSITORY = 'CLUB_REPOSITORY'

export interface ClubRepository {
  findAll(): Promise<ClubEntity[]>
  findById(clubId: string): Promise<ClubEntity | null>

}