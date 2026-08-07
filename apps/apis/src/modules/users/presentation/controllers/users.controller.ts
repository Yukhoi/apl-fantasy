import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { GetUserByIdUseCase } from "../../application/use-cases/get-user-by-id.use-case";
import { UserResponseDto } from "../../application/dto/user-response.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly getUserByIdUseCase: GetUserByIdUseCase) {}

  @Get(":userId")
  async findById(
    @Param("userId", new ParseUUIDPipe()) userId: string,
  ): Promise<UserResponseDto> {
    return this.getUserByIdUseCase.execute(userId);
  }
}
