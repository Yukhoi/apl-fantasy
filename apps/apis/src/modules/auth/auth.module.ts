import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsersModule } from "../users/users.module";
import { RegisterUseCase } from "./application/use-cases/register.use-case";
import { LoginUseCase } from "./application/use-cases/login.use-case";
import { GetMeUseCase } from "./application/use-cases/get-me.use-case";
import { BcryptPasswordHasher } from "./infrastructure/services/bcrypt-password-hasher.service";
import { JwtTokenService } from "./infrastructure/services/jwt-token.service";
import { JwtStrategy } from "./infrastructure/strategies/jwt.strategy";
import { JwtAuthGuard } from "./infrastructure/guards/jwt-auth.guard";
import { AuthController } from "./presentation/controllers/auth.controller";
import type { StringValue } from "ms";
import { PASSWORD_HASHER } from "./domain/interfaces/password-hasher.interface";
import { TOKEN_SERVICE } from "./domain/interfaces/token-service.interface";

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: (configService.get<string>("JWT_EXPIRES_IN") ??
            "7d") as StringValue,
        },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    GetMeUseCase,
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
    JwtStrategy,
  ],
})
export class AuthModule {}
