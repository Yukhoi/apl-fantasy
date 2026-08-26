import { ConflictException, Inject, Injectable } from "@nestjs/common";
import {
  USER_TEAM_REPOSITORY,
  UserTeamRepository,
} from "../../domain/repositories/user-team.repository";
import {
  INITIAL_BUDGET,
  INITIAL_FREE_TRANSFERS,
} from "../../domain/constants/user-team-rules";
import { CreateUserTeamDto } from "../dto/create-user-team.dto";
import { UserTeamResponseDto } from "../dto/user-team-response.dto";
import { GetSeasonByIdUseCase } from "../../../seasons/application/use-cases/get-season-by-id.use-case";
import { UserTeamMapper } from "../mappers/user-team.mapper";

@Injectable()
export class CreateUserTeamUseCase {
  constructor(
    @Inject(USER_TEAM_REPOSITORY)
    private readonly userTeamRepository: UserTeamRepository,
    private readonly getSeasonById: GetSeasonByIdUseCase,
  ) {}

  async execute(
    userId: string,
    input: CreateUserTeamDto,
  ): Promise<UserTeamResponseDto> {
    // 1. 确认 season 存在
    await this.getSeasonById.execute(input.seasonId);

    // 2. 检查该用户在这个赛季是否已经有球队
    const existing = await this.userTeamRepository.findByUserAndSeason(
      userId,
      input.seasonId,
    );

    if (existing) {
      throw new ConflictException("User already has a team for this season");
    }

    // 3. 创建球队
    const created = await this.userTeamRepository.create({
      userId,
      seasonId: input.seasonId,
      teamName: input.teamName,
      budgetLimit: INITIAL_BUDGET,
      budgetBalance: INITIAL_BUDGET,
      freeTransfers: INITIAL_FREE_TRANSFERS,
    });

    // 4. 返回 DTO
    return UserTeamMapper.toResponse(created);
  }
}
