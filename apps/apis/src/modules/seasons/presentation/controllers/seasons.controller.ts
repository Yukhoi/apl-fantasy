import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { GetAllSeasonsUseCase } from "../../application/use-cases/get-all-seasons.use-case";
import { GetSeasonByIdUseCase } from "../../application/use-cases/get-season-by-id.use-case";
import { GetCurrentSeasonUseCase } from "../../application/use-cases/get-current-season.use-case";
import { SeasonResponseDto } from "../../application/dto/season-response.dto";

@Controller("seasons")
export class SeasonsController {
  constructor(
    private readonly getAllSeasonsUseCase: GetAllSeasonsUseCase,
    private readonly getSeasonByIdUseCase: GetSeasonByIdUseCase,
    private readonly getCurrentSeasonUseCase: GetCurrentSeasonUseCase,
  ) {}

  @Get()
  async findAll(): Promise<SeasonResponseDto[]> {
    return this.getAllSeasonsUseCase.execute();
  }

  @Get("current")
  async findCurrent(): Promise<SeasonResponseDto> {
    return this.getCurrentSeasonUseCase.execute();
  }

  @Get(":seasonId")
  async findById(
    @Param("seasonId", new ParseUUIDPipe()) seasonId: string,
  ): Promise<SeasonResponseDto> {
    return this.getSeasonByIdUseCase.execute(seasonId);
  }
}
