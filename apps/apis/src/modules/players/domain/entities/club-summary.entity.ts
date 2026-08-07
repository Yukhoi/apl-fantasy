export class ClubSummaryEntity {
  constructor(
    public readonly clubId: string,
    public readonly name: string,
    public readonly shortName: string | null,
  ) {}
}