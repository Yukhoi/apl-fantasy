-- CreateEnum
CREATE TYPE "PlayerPosition" AS ENUM ('GK', 'DEF', 'MID', 'FWD');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('Available', 'Injured', 'Suspended', 'Unavailable');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('Upcoming', 'Active', 'Finished');

-- CreateEnum
CREATE TYPE "FixtureStatus" AS ENUM ('Scheduled', 'Live', 'Finished', 'Postponed', 'Cancelled');

-- CreateEnum
CREATE TYPE "TransferBatchStatus" AS ENUM ('Draft', 'Confirmed', 'Cancelled');

-- CreateEnum
CREATE TYPE "LedgerRefType" AS ENUM ('System', 'TransferBatch', 'Manual');

-- CreateEnum
CREATE TYPE "Formation" AS ENUM ('F532', 'F541', 'F523', 'F451', 'F442', 'F433', 'F352', 'F343');

-- CreateTable
CREATE TABLE "user" (
    "user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "season" (
    "season_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "SeasonStatus" NOT NULL,

    CONSTRAINT "season_pkey" PRIMARY KEY ("season_id")
);

-- CreateTable
CREATE TABLE "club" (
    "club_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,

    CONSTRAINT "club_pkey" PRIMARY KEY ("club_id")
);

-- CreateTable
CREATE TABLE "player" (
    "player_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "club_id" UUID NOT NULL,
    "position" "PlayerPosition" NOT NULL,
    "status" "PlayerStatus" NOT NULL,
    "current_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "player_pkey" PRIMARY KEY ("player_id")
);

-- CreateTable
CREATE TABLE "gameweek" (
    "gameweek_id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "gw_number" INTEGER NOT NULL,
    "deadline_at" TIMESTAMP(3) NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gameweek_pkey" PRIMARY KEY ("gameweek_id")
);

-- CreateTable
CREATE TABLE "fixture" (
    "fixture_id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "gameweek_id" UUID NOT NULL,
    "home_club_id" UUID NOT NULL,
    "away_club_id" UUID NOT NULL,
    "kickoff_at" TIMESTAMP(3) NOT NULL,
    "status" "FixtureStatus" NOT NULL,

    CONSTRAINT "fixture_pkey" PRIMARY KEY ("fixture_id")
);

-- CreateTable
CREATE TABLE "player_match_stats" (
    "pms_id" UUID NOT NULL,
    "fixture_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "minutes_played" INTEGER NOT NULL,
    "goals" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "saves" INTEGER NOT NULL,
    "tackles" INTEGER NOT NULL,
    "yellow_cards" INTEGER NOT NULL,
    "red_cards" INTEGER NOT NULL,
    "own_goals" INTEGER NOT NULL,
    "clean_sheet_at_sub" BOOLEAN NOT NULL,

    CONSTRAINT "player_match_stats_pkey" PRIMARY KEY ("pms_id")
);

-- CreateTable
CREATE TABLE "user_team" (
    "user_team_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "team_name" TEXT NOT NULL,
    "budget_limit" DECIMAL(10,2) NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "free_transfers" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_team_pkey" PRIMARY KEY ("user_team_id")
);

-- CreateTable
CREATE TABLE "user_team_player" (
    "user_team_player_id" UUID NOT NULL,
    "user_team_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "purchase_price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "user_team_player_pkey" PRIMARY KEY ("user_team_player_id")
);

-- CreateTable
CREATE TABLE "gameweek_squad" (
    "gw_squad_id" UUID NOT NULL,
    "user_team_id" UUID NOT NULL,
    "gameweek_id" UUID NOT NULL,
    "formation" "Formation" NOT NULL,
    "captain_player_id" UUID NOT NULL,
    "vice_captain_player_id" UUID NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "gw_points" INTEGER NOT NULL DEFAULT 0,
    "transfer_points_hit" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "gameweek_squad_pkey" PRIMARY KEY ("gw_squad_id")
);

-- CreateTable
CREATE TABLE "gameweek_squad_player" (
    "gw_squad_player_id" UUID NOT NULL,
    "gw_squad_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "is_starting" BOOLEAN NOT NULL,
    "bench_order" INTEGER,
    "player_points" INTEGER NOT NULL DEFAULT 0,
    "final_points" INTEGER NOT NULL DEFAULT 0,
    "was_auto_subbed_in" BOOLEAN NOT NULL DEFAULT false,
    "was_auto_subbed_out" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "gameweek_squad_player_pkey" PRIMARY KEY ("gw_squad_player_id")
);

-- CreateTable
CREATE TABLE "transfer_batch" (
    "transfer_batch_id" UUID NOT NULL,
    "user_team_id" UUID NOT NULL,
    "gameweek_id" UUID NOT NULL,
    "status" "TransferBatchStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "transfers_made" INTEGER NOT NULL DEFAULT 0,
    "points_cost" INTEGER NOT NULL DEFAULT 0,
    "budget_balance_after" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "transfer_batch_pkey" PRIMARY KEY ("transfer_batch_id")
);

-- CreateTable
CREATE TABLE "transfer" (
    "transfer_id" UUID NOT NULL,
    "transfer_batch_id" UUID NOT NULL,
    "player_out_id" UUID NOT NULL,
    "player_in_id" UUID NOT NULL,
    "sell_price" DECIMAL(10,2) NOT NULL,
    "buy_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "transfer_pkey" PRIMARY KEY ("transfer_id")
);

-- CreateTable
CREATE TABLE "transfer_credit_ledger" (
    "ledger_id" UUID NOT NULL,
    "user_team_id" UUID NOT NULL,
    "gameweek_id" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "ref_type" "LedgerRefType" NOT NULL,
    "ref_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfer_credit_ledger_pkey" PRIMARY KEY ("ledger_id")
);

-- CreateTable
CREATE TABLE "private_league" (
    "league_id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "join_code" TEXT NOT NULL,
    "max_members" INTEGER NOT NULL DEFAULT 20,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "private_league_pkey" PRIMARY KEY ("league_id")
);

-- CreateTable
CREATE TABLE "private_league_member" (
    "league_member_id" UUID NOT NULL,
    "league_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_team_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "private_league_member_pkey" PRIMARY KEY ("league_member_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "season_name_key" ON "season"("name");

-- CreateIndex
CREATE UNIQUE INDEX "club_name_key" ON "club"("name");

-- CreateIndex
CREATE INDEX "player_club_id_idx" ON "player"("club_id");

-- CreateIndex
CREATE INDEX "player_position_idx" ON "player"("position");

-- CreateIndex
CREATE UNIQUE INDEX "player_name_club_id_key" ON "player"("name", "club_id");

-- CreateIndex
CREATE INDEX "gameweek_season_id_idx" ON "gameweek"("season_id");

-- CreateIndex
CREATE INDEX "gameweek_deadline_at_idx" ON "gameweek"("deadline_at");

-- CreateIndex
CREATE UNIQUE INDEX "gameweek_season_id_gw_number_key" ON "gameweek"("season_id", "gw_number");

-- CreateIndex
CREATE INDEX "fixture_season_id_idx" ON "fixture"("season_id");

-- CreateIndex
CREATE INDEX "fixture_gameweek_id_idx" ON "fixture"("gameweek_id");

-- CreateIndex
CREATE INDEX "fixture_kickoff_at_idx" ON "fixture"("kickoff_at");

-- CreateIndex
CREATE INDEX "player_match_stats_player_id_idx" ON "player_match_stats"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_match_stats_fixture_id_player_id_key" ON "player_match_stats"("fixture_id", "player_id");

-- CreateIndex
CREATE INDEX "user_team_season_id_idx" ON "user_team"("season_id");

-- CreateIndex
CREATE INDEX "user_team_user_id_idx" ON "user_team"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_team_user_id_season_id_key" ON "user_team"("user_id", "season_id");

-- CreateIndex
CREATE INDEX "user_team_player_user_team_id_idx" ON "user_team_player"("user_team_id");

-- CreateIndex
CREATE INDEX "user_team_player_player_id_idx" ON "user_team_player"("player_id");

-- CreateIndex
CREATE INDEX "user_team_player_user_team_id_is_active_idx" ON "user_team_player"("user_team_id", "is_active");

-- CreateIndex
CREATE INDEX "gameweek_squad_gameweek_id_idx" ON "gameweek_squad"("gameweek_id");

-- CreateIndex
CREATE UNIQUE INDEX "gameweek_squad_user_team_id_gameweek_id_key" ON "gameweek_squad"("user_team_id", "gameweek_id");

-- CreateIndex
CREATE INDEX "gameweek_squad_player_player_id_idx" ON "gameweek_squad_player"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "gameweek_squad_player_gw_squad_id_player_id_key" ON "gameweek_squad_player"("gw_squad_id", "player_id");

-- CreateIndex
CREATE INDEX "transfer_batch_user_team_id_gameweek_id_idx" ON "transfer_batch"("user_team_id", "gameweek_id");

-- CreateIndex
CREATE INDEX "transfer_batch_status_idx" ON "transfer_batch"("status");

-- CreateIndex
CREATE INDEX "transfer_transfer_batch_id_idx" ON "transfer"("transfer_batch_id");

-- CreateIndex
CREATE INDEX "transfer_player_out_id_idx" ON "transfer"("player_out_id");

-- CreateIndex
CREATE INDEX "transfer_player_in_id_idx" ON "transfer"("player_in_id");

-- CreateIndex
CREATE INDEX "transfer_credit_ledger_user_team_id_gameweek_id_idx" ON "transfer_credit_ledger"("user_team_id", "gameweek_id");

-- CreateIndex
CREATE INDEX "transfer_credit_ledger_ref_type_ref_id_idx" ON "transfer_credit_ledger"("ref_type", "ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "private_league_join_code_key" ON "private_league"("join_code");

-- CreateIndex
CREATE INDEX "private_league_season_id_idx" ON "private_league"("season_id");

-- CreateIndex
CREATE INDEX "private_league_owner_user_id_idx" ON "private_league"("owner_user_id");

-- CreateIndex
CREATE INDEX "private_league_member_user_id_idx" ON "private_league_member"("user_id");

-- CreateIndex
CREATE INDEX "private_league_member_user_team_id_idx" ON "private_league_member"("user_team_id");

-- CreateIndex
CREATE UNIQUE INDEX "private_league_member_league_id_user_id_key" ON "private_league_member"("league_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "private_league_member_league_id_user_team_id_key" ON "private_league_member"("league_id", "user_team_id");

-- AddForeignKey
ALTER TABLE "player" ADD CONSTRAINT "player_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "club"("club_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek" ADD CONSTRAINT "gameweek_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("season_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fixture_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("season_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fixture_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "gameweek"("gameweek_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fixture_home_club_id_fkey" FOREIGN KEY ("home_club_id") REFERENCES "club"("club_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixture" ADD CONSTRAINT "fixture_away_club_id_fkey" FOREIGN KEY ("away_club_id") REFERENCES "club"("club_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_fixture_id_fkey" FOREIGN KEY ("fixture_id") REFERENCES "fixture"("fixture_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_match_stats" ADD CONSTRAINT "player_match_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_team" ADD CONSTRAINT "user_team_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_team" ADD CONSTRAINT "user_team_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("season_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_team_player" ADD CONSTRAINT "user_team_player_user_team_id_fkey" FOREIGN KEY ("user_team_id") REFERENCES "user_team"("user_team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_team_player" ADD CONSTRAINT "user_team_player_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_squad" ADD CONSTRAINT "gameweek_squad_user_team_id_fkey" FOREIGN KEY ("user_team_id") REFERENCES "user_team"("user_team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_squad" ADD CONSTRAINT "gameweek_squad_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "gameweek"("gameweek_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_squad" ADD CONSTRAINT "gameweek_squad_captain_player_id_fkey" FOREIGN KEY ("captain_player_id") REFERENCES "player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_squad" ADD CONSTRAINT "gameweek_squad_vice_captain_player_id_fkey" FOREIGN KEY ("vice_captain_player_id") REFERENCES "player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_squad_player" ADD CONSTRAINT "gameweek_squad_player_gw_squad_id_fkey" FOREIGN KEY ("gw_squad_id") REFERENCES "gameweek_squad"("gw_squad_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gameweek_squad_player" ADD CONSTRAINT "gameweek_squad_player_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_batch" ADD CONSTRAINT "transfer_batch_user_team_id_fkey" FOREIGN KEY ("user_team_id") REFERENCES "user_team"("user_team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_batch" ADD CONSTRAINT "transfer_batch_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "gameweek"("gameweek_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_transfer_batch_id_fkey" FOREIGN KEY ("transfer_batch_id") REFERENCES "transfer_batch"("transfer_batch_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_player_out_id_fkey" FOREIGN KEY ("player_out_id") REFERENCES "player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_player_in_id_fkey" FOREIGN KEY ("player_in_id") REFERENCES "player"("player_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_credit_ledger" ADD CONSTRAINT "transfer_credit_ledger_user_team_id_fkey" FOREIGN KEY ("user_team_id") REFERENCES "user_team"("user_team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_credit_ledger" ADD CONSTRAINT "transfer_credit_ledger_gameweek_id_fkey" FOREIGN KEY ("gameweek_id") REFERENCES "gameweek"("gameweek_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_league" ADD CONSTRAINT "private_league_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_league" ADD CONSTRAINT "private_league_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "season"("season_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_league_member" ADD CONSTRAINT "private_league_member_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "private_league"("league_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_league_member" ADD CONSTRAINT "private_league_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_league_member" ADD CONSTRAINT "private_league_member_user_team_id_fkey" FOREIGN KEY ("user_team_id") REFERENCES "user_team"("user_team_id") ON DELETE CASCADE ON UPDATE CASCADE;
