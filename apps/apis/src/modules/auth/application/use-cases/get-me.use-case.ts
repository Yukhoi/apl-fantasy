import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtPayload } from "../../domain/interfaces/token-service.interface";
import { GetUserByIdUseCase } from "../../../users/application/use-cases/get-user-by-id.use-case";
import { UserResponseDto } from "../../../users/application/dto/user-response.dto";

@Injectable()
export class GetMeUseCase {
  constructor(private readonly getUserById: GetUserByIdUseCase) {}

  async execute(payload: JwtPayload): Promise<UserResponseDto> {
    try {
      return await this.getUserById.execute(payload.sub);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException("Invalid token");
      }
      throw error;
    }
  }
}