import { PlayerPosition, PlayerStatus } from '@prisma/client'
import { PlayerEntity } from '../entities/player.entity'

export const PLAYER_REPOSITORY = 'PLAYER_REPOSITORY'

export type PlayerSortBy = 'name' | 'currentPrice' | 'position' | 'status'
export type SortOrder = 'asc' | 'desc'

export type FindPlayersFilters = {
  clubId?: string
  position?: PlayerPosition
  status?: PlayerStatus
  name?: string
}

export type FindPlayersOptions = {
  filters?: FindPlayersFilters
  page: number
  limit: number
  sortBy: PlayerSortBy
  order: SortOrder
}

export type PaginatedPlayersResult = {
  data: PlayerEntity[]
  total: number
  page: number
  limit: number
}

export interface PlayerRepository {
  findAll(options: FindPlayersOptions): Promise<PaginatedPlayersResult>
  findById(playerId: string): Promise<PlayerEntity | null>
  findByIds(playerIds: string[]): Promise<PlayerEntity[]>
}

