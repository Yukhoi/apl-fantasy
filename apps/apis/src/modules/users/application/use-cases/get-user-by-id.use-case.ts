import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  USER_REPOSITORY,
  UserRepository,
} from "../../domain/repositories/user.repository";
import { UserResponseDto } from "../dto/user-response.dto";

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return new UserResponseDto({
      userId: user.userId,
      email: user.email,
      username: user.username,
      registeredAt: user.registeredAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      isActive: user.isActive,
    });
  }
}
