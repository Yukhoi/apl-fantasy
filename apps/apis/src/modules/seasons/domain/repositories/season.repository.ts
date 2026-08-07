import { SeasonEntity } from "../entities/season.entity";

export const SEASON_REPOSITORY = "SEASON_REPOSITORY";

export interface SeasonRepository {
  findAll(): Promise<SeasonEntity[]>;
  findById(seasonId: string): Promise<SeasonEntity | null>;
  findCurrent(): Promise<SeasonEntity | null>;
}
