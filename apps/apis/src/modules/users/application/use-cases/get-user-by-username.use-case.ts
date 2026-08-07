import { Inject, Injectable } from "@nestjs/common";
import {
  USER_REPOSITORY,
  UserRepository,
} from "../../domain/repositories/user.repository";
import { UserEntity } from "../../domain/entities/user.entity";

@Injectable()
export class GetUserByUsernameUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  // Returns UserEntity | null intentionally for internal/auth use
  async execute(username: string): Promise<UserEntity | null> {
    return this.userRepository.findByUsername(username);
  }
}
