import { IsNotEmpty, IsString, IsUUID, Length } from "class-validator";

export class CreateUserTeamDto {
  @IsUUID()
  seasonId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  teamName!: string;
}