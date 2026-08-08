import { UserTeamResponseDto } from "../dto/user-team-response.dto";
import {
  USER_TEAM_REPOSITORY,
  UserTeamRepository,
} from "../../domain/repositories/user-team.repository";
import { Inject, Injectable } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common";
import { UserTeamMapper } from "../mappers/user-team.mapper";

@Injectable()
export class GetMyUserTeamUseCase {
  constructor(
    @Inject(USER_TEAM_REPOSITORY)
    private readonly userTeamRepository: UserTeamRepository,
  ) {}

  async execute(
    userId: string,
    seasonId: string,
  ): Promise<UserTeamResponseDto> {
    const team = await this.userTeamRepository.findByUserAndSeason(
      userId,
      seasonId,
    );

    if (!team) {
      throw new NotFoundException("User team not found");
    }

    return UserTeamMapper.toResponse(team);
  }
}
