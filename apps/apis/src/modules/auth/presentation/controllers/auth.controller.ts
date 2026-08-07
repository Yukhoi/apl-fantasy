import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { RegisterDto } from "../../application/dto/register.dto";
import { LoginDto } from "../../application/dto/login.dto";
import { RegisterUseCase } from "../../application/use-cases/register.use-case";
import { LoginUseCase } from "../../application/use-cases/login.use-case";
import { GetMeUseCase } from "../../application/use-cases/get-me.use-case";
import { JwtAuthGuard } from "../../infrastructure/guards/jwt-auth.guard";
import { CurrentUser } from "../../infrastructure/decorators/current-user.decorator";
import { JwtPayload } from "../../domain/interfaces/token-service.interface";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Post("register")
  async register(@Body() body: RegisterDto) {
    return this.registerUseCase.execute(body);
  }

  @Post("login")
  async login(@Body() body: LoginDto) {
    return this.loginUseCase.execute(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@CurrentUser() payload: JwtPayload) {
    return this.getMeUseCase.execute(payload);
  }
}
