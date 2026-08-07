import { SeasonStatus } from "@prisma/client";

export class SeasonEntity {
  constructor(
    public readonly seasonId: string,
    public readonly name: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly status: SeasonStatus,
  ) {}
}
