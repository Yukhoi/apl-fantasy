export class SquadPlayerClubResponseDto {
  clubId!: string;
  name!: string;
  shortName!: string | null;
}

export class SquadPlayerResponseDto {
  playerId!: string;
  name!: string;
  clubId!: string;
  position!: string;
  status!: string;
  currentPrice!: string;
  club!: SquadPlayerClubResponseDto;
}

export class UserTeamPlayerResponseDto {
  userTeamPlayerId!: string;
  userTeamId!: string;
  playerId!: string;
  purchasePrice!: string;
  isActive!: boolean;
  joinedAt!: string;
  leftAt!: string | null;
  player!: SquadPlayerResponseDto;
}