import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from "class-validator";

export class CreateInitialSquadDto {
  @IsArray()
  @ArrayMinSize(15)
  @ArrayMaxSize(15)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  playerIds!: string[];
}