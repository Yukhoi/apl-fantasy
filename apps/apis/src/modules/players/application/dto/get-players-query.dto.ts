import { Transform, Type } from 'class-transformer'
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator'
import { PlayerPosition, PlayerStatus } from '@prisma/client'
import { PlayerSortBy, SortOrder } from '../../domain/repositories/player.repository'

export class GetPlayersQueryDto {
  @IsOptional()
  @IsUUID()
  clubId?: string

  @IsOptional()
  @IsEnum(PlayerPosition)
  position?: PlayerPosition

  @IsOptional()
  @IsEnum(PlayerStatus)
  status?: PlayerStatus

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10

  @IsOptional()
  @IsIn(['name', 'currentPrice', 'position', 'status'])
  sortBy: PlayerSortBy = 'name'

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: SortOrder = 'asc'
}