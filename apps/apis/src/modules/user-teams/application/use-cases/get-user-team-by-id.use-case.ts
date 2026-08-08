import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  USER_TEAM_REPOSITORY,
  UserTeamRepository,
} from "../../domain/repositories/user-team.repository";

import { UserTeamResponseDto } from "../dto/user-team-response.dto";
import { UserTeamMapper } from "../mappers/user-team.mapper";

@Injectable()
export class GetUserTeamByIdUseCase {
  constructor(
    @Inject(USER_TEAM_REPOSITORY)
    private readonly userTeamRepository: UserTeamRepository,
  ) {}

  async execute(
    userId: string,
    userTeamId: string,
  ): Promise<UserTeamResponseDto> {
    const userTeam = await this.userTeamRepository.findById(userTeamId);

    if (!userTeam) {
      throw new NotFoundException("User team not found");
    }

    if (userTeam.userId !== userId) {
      throw new ForbiddenException(
        "You do not have access to this user team",
      );
    }

    return UserTeamMapper.toResponse(userTeam);
  }
}