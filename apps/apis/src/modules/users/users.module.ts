import { Module } from "@nestjs/common";
import { USER_REPOSITORY } from "./domain/repositories/user.repository";
import { PrismaUserRepository } from "./infrastructure/repositories/prisma-user.repository";
import { GetUserByIdUseCase } from "./application/use-cases/get-user-by-id.use-case";
import { GetUserByEmailUseCase } from "./application/use-cases/get-user-by-email.use-case";
import { GetUserByUsernameUseCase } from "./application/use-cases/get-user-by-username.use-case";
import { CreateUserUseCase } from "./application/use-cases/create-user.use-case";
import { UsersController } from "./presentation/controllers/users.controller";

@Module({
  controllers: [UsersController],
  providers: [
    GetUserByIdUseCase,
    GetUserByEmailUseCase,
    GetUserByUsernameUseCase,
    CreateUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [
    GetUserByIdUseCase,
    GetUserByEmailUseCase,
    GetUserByUsernameUseCase,
    CreateUserUseCase,
  ],
})
export class UsersModule {}
