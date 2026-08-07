import { FixtureStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsUUID } from 'class-validator'

export class GetFixturesQueryDto {
  @IsOptional()
  @IsUUID()
  seasonId?: string

  @IsOptional()
  @IsUUID()
  gameweekId?: string

  @IsOptional()
  @IsUUID()
  clubId?: string

  @IsOptional()
  @IsEnum(FixtureStatus)
  status?: FixtureStatus
}