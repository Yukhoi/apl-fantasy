import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { CreateUserTeamDto } from "../../application/dto/create-user-team.dto";
import { CreateUserTeamUseCase } from "../../application/use-cases/create-user-team.use-case";
import { GetMyUserTeamUseCase } from "../../application/use-cases/get-my-user-team.use-case";
import { GetUserTeamByIdUseCase } from "../../application/use-cases/get-user-team-by-id.use-case";

import { JwtAuthGuard } from "../../../auth/infrastructure/guards/jwt-auth.guard";
import { CurrentUser } from "../../../auth/infrastructure/decorators/current-user.decorator";
import { JwtPayload } from "../../../auth/domain/interfaces/token-service.interface";

@Controller("user-teams")
@UseGuards(JwtAuthGuard)
export class UserTeamsController {
  constructor(
    private readonly createUserTeamUseCase: CreateUserTeamUseCase,
    private readonly getMyUserTeamUseCase: GetMyUserTeamUseCase,
    private readonly getUserTeamByIdUseCase: GetUserTeamByIdUseCase,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateUserTeamDto,
  ) {
    return this.createUserTeamUseCase.execute(user.sub, body);
  }

  @Get("me")
  async getMyTeam(
    @CurrentUser() user: JwtPayload,
    @Query("seasonId", new ParseUUIDPipe()) seasonId: string,
  ) {
    return this.getMyUserTeamUseCase.execute(
      user.sub,
      seasonId,
    );
  }

  @Get(":userTeamId")
  async getById(
    @CurrentUser() user: JwtPayload,
    @Param("userTeamId", new ParseUUIDPipe()) userTeamId: string,
  ) {
    return this.getUserTeamByIdUseCase.execute(
      user.sub,
      userTeamId,
    );
  }
}