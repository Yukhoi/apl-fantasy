export class GameweekEntity {
  constructor(
    public readonly gameweekId: string,
    public readonly seasonId: string,
    public readonly gwNumber: number,
    public readonly date: Date,
  ) {}
}