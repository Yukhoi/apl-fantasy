import { UserResponseDto } from "../../../users/application/dto/user-response.dto";

export class AuthResponseDto {
  accessToken!: string;
  user!: UserResponseDto;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
