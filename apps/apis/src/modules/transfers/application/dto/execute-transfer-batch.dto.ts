import {
  ArrayMinSize,
  IsArray,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class TransferItemDto {
  @IsUUID()
  playerOutId!: string;

  @IsUUID()
  playerInId!: string;
}

export class ExecuteTransferBatchDto {
  @IsUUID()
  gameweekId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  transfers!: TransferItemDto[];
}