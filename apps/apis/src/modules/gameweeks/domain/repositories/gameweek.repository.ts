import { GameweekEntity } from '../entities/gameweek.entity'

export const GAMEWEEK_REPOSITORY = 'GAMEWEEK_REPOSITORY'

export type FindGameweeksFilters = {
  seasonId?: string
  gwNumber?: number
}

export interface GameweekRepository {
  findAll(filters?: FindGameweeksFilters): Promise<GameweekEntity[]>
  findById(gameweekId: string): Promise<GameweekEntity | null>
}