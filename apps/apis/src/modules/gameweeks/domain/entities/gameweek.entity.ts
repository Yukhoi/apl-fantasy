export class GameweekEntity {
  constructor(
    public readonly gameweekId: string,
    public readonly seasonId: string,
    public readonly gwNumber: number,
    public readonly deadlineAt: Date,
    public readonly startsAt: Date,
    public readonly endsAt: Date,
  ) {}
}