import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { GetAllGameweeksUseCase } from "../../application/use-cases/get-all-gameweeks.use-case";
import { GetGameweekByIdUseCase } from "../../application/use-cases/get-gameweek-by-id.use-case";
import { GetGameweeksQueryDto } from "../../application/dto/get-gameweeks-query.dto";
import { GameweekResponseDto } from "../../application/dto/gameweek-response.dto";

@Controller("gameweeks")
export class GameweeksController {
  constructor(
    private readonly getAllGameweeksUseCase: GetAllGameweeksUseCase,
    private readonly getGameweekByIdUseCase: GetGameweekByIdUseCase,
  ) {}

  @Get()
  async findAll(
    @Query() query: GetGameweeksQueryDto,
  ): Promise<GameweekResponseDto[]> {
    return this.getAllGameweeksUseCase.execute({
      seasonId: query.seasonId,
      gwNumber: query.gwNumber,
    });
  }

  @Get(":gameweekId")
  async findById(
    @Param("gameweekId", new ParseUUIDPipe()) gameweekId: string,
  ): Promise<GameweekResponseDto> {
    return this.getGameweekByIdUseCase.execute(gameweekId);
  }
}
