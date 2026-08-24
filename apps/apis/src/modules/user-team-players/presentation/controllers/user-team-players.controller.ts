import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { CreateInitialSquadDto } from "../../application/dto/create-initial-squad.dto";
import { CreateInitialSquadUseCase } from "../../application/use-cases/create-initial-squad.use-case";
import { GetUserTeamPlayersUseCase } from "../../application/use-cases/get-user-team-players.use-case";

import { JwtAuthGuard } from "../../../auth/infrastructure/guards/jwt-auth.guard";
import { CurrentUser } from "../../../auth/infrastructure/decorators/current-user.decorator";
import { JwtPayload } from "../../../auth/domain/interfaces/token-service.interface";

@Controller("user-teams/:userTeamId/players")
@UseGuards(JwtAuthGuard)
export class UserTeamPlayersController {
  constructor(
    private readonly createInitialSquadUseCase: CreateInitialSquadUseCase,
    private readonly getUserTeamPlayersUseCase: GetUserTeamPlayersUseCase,
  ) {}

  @Post()
  async createInitialSquad(
    @CurrentUser() user: JwtPayload,
    @Param("userTeamId", new ParseUUIDPipe()) userTeamId: string,
    @Body() body: CreateInitialSquadDto,
  ) {
    return this.createInitialSquadUseCase.execute(
      user.sub,
      userTeamId,
      body,
    );
  }

  @Get()
  async getPlayers(
    @CurrentUser() user: JwtPayload,
    @Param("userTeamId", new ParseUUIDPipe()) userTeamId: string,
  ) {
    return this.getUserTeamPlayersUseCase.execute(
      user.sub,
      userTeamId,
    );
  }
}