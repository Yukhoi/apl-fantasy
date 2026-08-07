import { IsEmail, IsString, Length } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(3, 30)
  username!: string;

  @IsString()
  @Length(8)
  password!: string;
}
