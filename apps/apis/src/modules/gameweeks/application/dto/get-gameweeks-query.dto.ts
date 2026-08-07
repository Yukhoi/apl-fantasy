import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator'

export class GetGameweeksQueryDto {
  @IsOptional()
  @IsUUID()
  seasonId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  gwNumber?: number
}