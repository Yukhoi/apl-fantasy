import { SeasonStatus } from "@prisma/client";

export class SeasonResponseDto {
  seasonId!: string;
  name!: string;
  startDate!: string;
  endDate!: string;
  status!: SeasonStatus;
}
