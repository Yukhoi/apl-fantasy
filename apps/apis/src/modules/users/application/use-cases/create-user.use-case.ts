import { Inject, Injectable, ConflictException } from "@nestjs/common";
import {
  USER_REPOSITORY,
  UserRepository,
} from "../../domain/repositories/user.repository";
import { CreateUserDto } from "../dto/create-user.dto";
import { UserResponseDto } from "../dto/user-response.dto";

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: CreateUserDto): Promise<UserResponseDto> {
    const existingByEmail = await this.userRepository.findByEmail(input.email);
    if (existingByEmail) {
      throw new ConflictException("Email already exists");
    }

    const existingByUsername = await this.userRepository.findByUsername(
      input.username,
    );
    if (existingByUsername) {
      throw new ConflictException("Username already exists");
    }

    const created = await this.userRepository.create({
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
    });

    return new UserResponseDto({
      userId: created.userId,
      email: created.email,
      username: created.username,
      registeredAt: created.registeredAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      isActive: created.isActive,
    });
  }
}
