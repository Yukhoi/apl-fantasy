import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common'
import { GetAllClubsUseCase } from '../../application/use-cases/get-all-clubs.use-case'
import { ClubResponseDto } from '../../application/dto/club-response.dto'
import { GetClubByIdUseCase } from '../../application/use-cases/get-club-by-id.use-case'


@Controller('clubs')
export class ClubsController {
  constructor(
    private readonly getAllClubsUseCase: GetAllClubsUseCase,
    private readonly getClubByIdUseCase: GetClubByIdUseCase
  ) {}

  @Get()
  async findAll(): Promise<ClubResponseDto[]> {
    return this.getAllClubsUseCase.execute()
  }

  @Get(':clubId')
  async findById(@Param('clubId', new ParseUUIDPipe()) clubId: string): Promise<ClubResponseDto> {
    return this.getClubByIdUseCase.execute(clubId)
  }

}