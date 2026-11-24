import { randomUUID } from "node:crypto";
import {
  LedgerRefType,
  PlayerPosition,
  PlayerStatus,
  Prisma,
  SeasonStatus,
  TransferBatchStatus,
} from "@prisma/client";

import { PrismaService } from "../../../../prisma/prisma.service";
import { ExecuteTransferBatchData } from "../../domain/repositories/transfer-batch.repository";
import { TransferBatchEntity } from "../../domain/entities/transfer-batch.entity";
import { PrismaTransferBatchRepository } from "./prisma-transfer-batch.repository";

function createFixture() {
  const ids = {
    userId: randomUUID(),
    seasonId: randomUUID(),
    clubId: randomUUID(),
    gameweekId: randomUUID(),
    userTeamId: randomUUID(),
    playerOutId: randomUUID(),
    playerInId: randomUUID(),
    userTeamPlayerId: randomUUID(),
  };
  const data: ExecuteTransferBatchData = {
    userTeamId: ids.userTeamId,
    gameweekId: ids.gameweekId,
    transfers: [{
      playerOutId: ids.playerOutId,
      playerInId: ids.playerInId,
      sellPrice: new Prisma.Decimal("7.25"),
      buyPrice: new Prisma.Decimal("8.50"),
    }],
    transfersMade: 1,
    pointsCost: 0,
    freeTransfersUsed: 1,
    freeTransfersAfter: 1,
    expectedBudgetBalance: new Prisma.Decimal("25.00"),
    expectedFreeTransfers: 2,
    budgetBalanceAfter: new Prisma.Decimal("23.75"),
    confirmedAt: new Date("2026-09-05T17:59:00Z"),
  };
  return { ids, data };
}

describe("PrismaTransferBatchRepository (PostgreSQL integration)", () => {
  let prisma: PrismaService;
  let repository: PrismaTransferBatchRepository;
  let fixture: ReturnType<typeof createFixture>;
  let ledgerConstraint: string | undefined;

  beforeAll(async () => {
    // The Jest setup validates .env.test before this client is constructed.
    prisma = new PrismaService();
    await prisma.$connect();
    const identity = await prisma.$queryRaw<
      { database: string; username: string; schema: string }[]
    >`SELECT current_database() AS database, current_user AS username,
             current_schema() AS schema`;
    expect(identity).toEqual([{
      database: "apl_fantasy_test",
      username: "apl_test",
      schema: "public",
    }]);
    repository = new PrismaTransferBatchRepository(prisma);
  });

  beforeEach(async () => {
    // Keep IDs available to cleanup even if fixture creation fails.
    fixture = createFixture();
    const { ids, data } = fixture;
    await prisma.$transaction(async (tx) => {
      await tx.user.create({ data: {
        userId: ids.userId,
        email: `${ids.userId}@integration.invalid`,
        username: ids.userId,
        passwordHash: "integration-test-only",
      } });
      await tx.season.create({ data: {
        seasonId: ids.seasonId,
        name: `integration-${ids.seasonId}`,
        startDate: new Date("2026-08-01T00:00:00Z"),
        endDate: new Date("2027-06-01T00:00:00Z"),
        status: SeasonStatus.Active,
      } });
      await tx.club.create({ data: {
        clubId: ids.clubId,
        name: `integration-${ids.clubId}`,
      } });
      await tx.player.createMany({ data: [ids.playerOutId, ids.playerInId].map(
        (playerId) => ({
          playerId,
          name: `integration-${playerId}`,
          clubId: ids.clubId,
          position: PlayerPosition.MID,
          status: PlayerStatus.Available,
          currentPrice: playerId === ids.playerOutId
            ? data.transfers[0].sellPrice : data.transfers[0].buyPrice,
        }),
      ) });
      await tx.gameweek.create({ data: {
        gameweekId: ids.gameweekId,
        seasonId: ids.seasonId,
        gwNumber: 1,
        deadlineAt: new Date("2026-09-05T18:00:00Z"),
        startsAt: new Date("2026-09-05T19:00:00Z"),
        endsAt: new Date("2026-09-07T22:00:00Z"),
      } });
      await tx.userTeam.create({ data: {
        userTeamId: ids.userTeamId,
        userId: ids.userId,
        seasonId: ids.seasonId,
        teamName: "Integration team",
        budgetLimit: new Prisma.Decimal("100.00"),
        budgetBalance: data.expectedBudgetBalance,
        freeTransfers: data.expectedFreeTransfers,
      } });
      await tx.userTeamPlayer.create({ data: {
        userTeamPlayerId: ids.userTeamPlayerId,
        userTeamId: ids.userTeamId,
        playerId: ids.playerOutId,
        purchasePrice: new Prisma.Decimal("6.75"),
        joinedAt: new Date("2026-08-01T00:00:00Z"),
        isActive: true,
      } });
    });
  });

  async function removeLedgerConstraint() {
    if (ledgerConstraint) {
      // Identifier is generated solely from randomUUID(), never external input.
      await prisma.$executeRawUnsafe(
        `ALTER TABLE public.transfer_credit_ledger DROP CONSTRAINT IF EXISTS "${ledgerConstraint}"`,
      );
      ledgerConstraint = undefined;
    }
  }

  afterEach(async () => {
    try {
      await removeLedgerConstraint();
    } finally {
      if (fixture) {
        const { ids } = fixture;
        await prisma.$transaction([
          prisma.transferCreditLedger.deleteMany({ where: { userTeamId: ids.userTeamId } }),
          prisma.transfer.deleteMany({ where: { transferBatch: { userTeamId: ids.userTeamId } } }),
          prisma.transferBatch.deleteMany({ where: { userTeamId: ids.userTeamId } }),
          prisma.userTeamPlayer.deleteMany({ where: { userTeamId: ids.userTeamId } }),
          prisma.userTeam.deleteMany({ where: { userTeamId: ids.userTeamId } }),
          prisma.gameweek.deleteMany({ where: { gameweekId: ids.gameweekId } }),
          prisma.player.deleteMany({ where: { playerId: { in: [ids.playerOutId, ids.playerInId] } } }),
          prisma.club.deleteMany({ where: { clubId: ids.clubId } }),
          prisma.season.deleteMany({ where: { seasonId: ids.seasonId } }),
          prisma.user.deleteMany({ where: { userId: ids.userId } }),
        ]);
      }
    }
  });

  afterAll(async () => {
    try {
      await removeLedgerConstraint();
    } finally {
      await prisma?.$disconnect();
    }
  });

  async function readState() {
    const { ids } = fixture;
    const [team, squad, batches, transfers, ledgers] = await Promise.all([
      prisma.userTeam.findUniqueOrThrow({ where: { userTeamId: ids.userTeamId } }),
      prisma.userTeamPlayer.findMany({ where: { userTeamId: ids.userTeamId }, orderBy: { userTeamPlayerId: "asc" } }),
      prisma.transferBatch.findMany({ where: { userTeamId: ids.userTeamId } }),
      // Filter by our players as well, to catch a leaked transfer even if its batch is gone.
      prisma.transfer.findMany({ where: { OR: [{ playerOutId: ids.playerOutId }, { playerInId: ids.playerInId }] } }),
      prisma.transferCreditLedger.findMany({ where: { userTeamId: ids.userTeamId } }),
    ]);
    return { team, squad, batches, transfers, ledgers };
  }

  it("commits the batch, transfers, squad, finances and ledger together", async () => {
    const { ids, data } = fixture;
    const result = await repository.executeConfirmedBatch(data);
    const state = await readState();

    expect(result).toBeInstanceOf(TransferBatchEntity);
    expect(state.batches).toHaveLength(1);
    expect(state.batches[0]).toMatchObject({
      transferBatchId: result.transferBatchId,
      userTeamId: ids.userTeamId,
      gameweekId: ids.gameweekId,
      status: TransferBatchStatus.Confirmed,
      confirmedAt: data.confirmedAt,
      transfersMade: 1,
      pointsCost: 0,
      budgetBalanceAfter: data.budgetBalanceAfter,
    });
    expect(result).toEqual(expect.objectContaining(state.batches[0]));
    expect(state.transfers).toHaveLength(1);
    expect(state.transfers[0]).toMatchObject({
      transferBatchId: result.transferBatchId,
      ...data.transfers[0],
    });
    expect(state.squad).toHaveLength(2);
    expect(state.squad).toEqual(expect.arrayContaining([
      expect.objectContaining({
        userTeamPlayerId: ids.userTeamPlayerId,
        userTeamId: ids.userTeamId,
        playerId: ids.playerOutId,
        isActive: false,
        leftAt: data.confirmedAt,
        purchasePrice: new Prisma.Decimal("6.75"),
      }),
      expect.objectContaining({
        userTeamId: ids.userTeamId,
        playerId: ids.playerInId,
        isActive: true,
        joinedAt: data.confirmedAt,
        leftAt: null,
        purchasePrice: data.transfers[0].buyPrice,
      }),
    ]));
    expect(state.team.budgetBalance).toEqual(data.budgetBalanceAfter);
    expect(state.team.freeTransfers).toBe(data.freeTransfersAfter);
    expect(state.ledgers).toHaveLength(1);
    expect(state.ledgers[0]).toMatchObject({
      userTeamId: ids.userTeamId,
      gameweekId: ids.gameweekId,
      delta: -1,
      reason: "TRANSFER_USAGE",
      refType: LedgerRefType.TransferBatch,
      refId: result.transferBatchId,
    });
  });

  it("rolls back earlier writes when the outgoing player is inactive", async () => {
    await prisma.userTeamPlayer.update({
      where: { userTeamPlayerId: fixture.ids.userTeamPlayerId },
      data: { isActive: false, leftAt: new Date("2026-09-01T00:00:00Z") },
    });
    const before = await readState();
    await expect(repository.executeConfirmedBatch(fixture.data)).rejects.toThrow(
      `Failed to deactivate outgoing player ${fixture.ids.playerOutId}`,
    );
    expect(await readState()).toEqual(before);
  });

  it.each(["budget", "free transfers"])(
    "rolls back all writes when the expected %s is stale",
    async (field) => {
      const before = await readState();
      const data = { ...fixture.data };
      if (field === "budget") {
        data.expectedBudgetBalance = new Prisma.Decimal("26.00");
      } else {
        data.expectedFreeTransfers = 3;
      }
      await expect(repository.executeConfirmedBatch(data)).rejects.toThrow(
        "User team state has changed concurrently",
      );
      expect(await readState()).toEqual(before);
    },
  );

  it("rolls back every write when PostgreSQL rejects the final ledger insertion", async () => {
    const before = await readState();
    ledgerConstraint = `integration_ledger_${randomUUID().replace(/-/g, "")}`;
    try {
      // NOT VALID avoids scanning existing rows. PostgreSQL still checks new inserts.
      // Only this fixture's UUID is rejected; unrelated teams are unaffected.
      await prisma.$executeRawUnsafe(
        `ALTER TABLE public.transfer_credit_ledger ADD CONSTRAINT "${ledgerConstraint}"
         CHECK (user_team_id <> '${fixture.ids.userTeamId}'::uuid) NOT VALID`,
      );
      await expect(repository.executeConfirmedBatch(fixture.data)).rejects.toThrow(
        ledgerConstraint,
      );
      expect(await readState()).toEqual(before);
    } finally {
      await removeLedgerConstraint();
    }

    // Prove the same input can commit once the temporary failure is removed.
    await repository.executeConfirmedBatch(fixture.data);
    expect((await readState()).ledgers).toHaveLength(1);
  });
});
