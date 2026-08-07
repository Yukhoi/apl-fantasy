import { Inject, Injectable, ConflictException } from "@nestjs/common";
import { RegisterDto } from "../dto/register.dto";
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from "../../domain/interfaces/password-hasher.interface";
import {
  TOKEN_SERVICE,
  TokenService,
} from "../../domain/interfaces/token-service.interface";
import { CreateUserUseCase } from "../../../users/application/use-cases/create-user.use-case";
import { GetUserByEmailUseCase } from "../../../users/application/use-cases/get-user-by-email.use-case";
import { GetUserByUsernameUseCase } from "../../../users/application/use-cases/get-user-by-username.use-case";
import { AuthResponseDto } from "../dto/auth-response.dto";

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly getUserByEmail: GetUserByEmailUseCase,
    private readonly getUserByUsername: GetUserByUsernameUseCase,
    private readonly createUser: CreateUserUseCase,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RegisterDto): Promise<AuthResponseDto> {
    const existingEmail = await this.getUserByEmail.execute(input.email);
    if (existingEmail) {
      throw new ConflictException("Email already exists");
    }

    const existingUsername = await this.getUserByUsername.execute(
      input.username,
    );
    if (existingUsername) {
      throw new ConflictException("Username already exists");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const created = await this.createUser.execute({
      email: input.email,
      username: input.username,
      passwordHash,
    });

    const token = await this.tokenService.signAccessToken({
      sub: created.userId,
      email: created.email,
      username: created.username,
    });

    return new AuthResponseDto({
      accessToken: token,
      user: created,
    });
  }
}
