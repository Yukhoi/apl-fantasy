import { UserEntity } from "../entities/user.entity";

export const USER_REPOSITORY = "USER_REPOSITORY";

export interface UserRepository {
  findById(userId: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<UserEntity>;
}
