import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { LoginDto } from "../dto/login.dto";
import { GetUserByEmailUseCase } from "../../../users/application/use-cases/get-user-by-email.use-case";
import { GetUserByUsernameUseCase } from "../../../users/application/use-cases/get-user-by-username.use-case";
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from "../../domain/interfaces/password-hasher.interface";
import {
  TOKEN_SERVICE,
  TokenService,
} from "../../domain/interfaces/token-service.interface";
import { AuthResponseDto } from "../dto/auth-response.dto";

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly getUserByEmail: GetUserByEmailUseCase,
    private readonly getUserByUsername: GetUserByUsernameUseCase,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  private async findByEmailOrUsername(identifier: string) {
    const byEmail = await this.getUserByEmail.execute(identifier);
    if (byEmail) return byEmail;

    return this.getUserByUsername.execute(identifier);
  }

  async execute(input: LoginDto): Promise<AuthResponseDto> {
    const user = await this.findByEmailOrUsername(input.emailOrUsername);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const match = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!match) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = await this.tokenService.signAccessToken({
      sub: user.userId,
      email: user.email,
      username: user.username,
    });

    const userResponse = {
      userId: user.userId,
      email: user.email,
      username: user.username,
      registeredAt: user.registeredAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      isActive: user.isActive,
    };

    return new AuthResponseDto({
      accessToken: token,
      user: userResponse,
    });
  }
}
