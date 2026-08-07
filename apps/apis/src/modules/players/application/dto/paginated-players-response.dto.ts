import { PlayerResponseDto } from './player-response.dto'

export class PaginationMetaDto {
  page!: number
  limit!: number
  total!: number
  totalPages!: number
}

export class PaginatedPlayersResponseDto {
  data!: PlayerResponseDto[]
  meta!: PaginationMetaDto
}