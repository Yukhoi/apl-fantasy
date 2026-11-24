import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  TRANSFER_BATCH_REPOSITORY,
  TransferBatchRepository,
} from "../../domain/repositories/transfer-batch.repository";

import {
  USER_TEAM_REPOSITORY,
  UserTeamRepository,
} from "../../../user-teams/domain/repositories/user-team.repository";

import {
  GAMEWEEK_REPOSITORY,
  GameweekRepository,
} from "../../../gameweeks/domain/repositories/gameweek.repository";

import {
  USER_TEAM_PLAYER_REPOSITORY,
  UserTeamPlayerRepository,
} from "../../../user-team-players/domain/repositories/user-team-player.repository";

import {
  PLAYER_REPOSITORY,
  PlayerRepository,
} from "../../../players/domain/repositories/player.repository";

import { ExecuteTransferBatchDto } from "../dto/execute-transfer-batch.dto";
import { ExecuteTransferBatchResult } from "../dto/execute-transfer-batch-result";

import { MAX_PLAYERS_PER_CLUB } from "../../../user-team-players/domain/constants/squad-rules";
import { POINTS_PER_EXTRA_TRANSFER } from "../../domain/constants/transfer-rules";

import { Prisma } from "@prisma/client";

/**
 * ExecuteTransferBatchUseCase
 *
 * 负责执行 Fantasy 球队的一批转会操作（TransferBatch）。
 *
 * 一个 TransferBatch 可以包含多个 Transfer，每个 Transfer
 * 代表卖出一名球员并买入一名相同位置的球员。
 *
 * 主要职责：
 * 1. 验证球队所有权及 Gameweek 有效性。
 * 2. 验证转会截止时间。
 * 3. 验证卖出和买入球员的合法性。
 * 4. 验证转会后的阵容是否满足俱乐部人数限制。
 * 5. 计算转会预算变化。
 * 6. 计算免费转会次数消耗和额外转会积分扣除。
 * 7. 委托 Repository 原子化执行转会并持久化结果。
 *
 * 架构说明：
 * - 属于 Application Layer。
 * - 依赖 Domain Repository 抽象，而非具体 Prisma 实现。
 * - 业务验证和结算在 UseCase 中完成。
 * - 数据库事务由 TransferBatchRepository 负责。
 */
@Injectable()
export class ExecuteTransferBatchUseCase {
  /**
   * 通过依赖注入获取转会操作所需的 Repository。
   *
   * @param userTeamRepository 查询 Fantasy 球队信息。
   * @param gameweekRepository 查询比赛日及转会截止时间。
   * @param userTeamPlayerRepository 查询球队当前有效阵容。
   * @param playerRepository 查询球员属性及当前市场价格。
   * @param transferBatchRepository 持久化完整转会批次。
   */
  constructor(
    @Inject(USER_TEAM_REPOSITORY)
    private readonly userTeamRepository: UserTeamRepository,

    @Inject(GAMEWEEK_REPOSITORY)
    private readonly gameweekRepository: GameweekRepository,

    @Inject(USER_TEAM_PLAYER_REPOSITORY)
    private readonly userTeamPlayerRepository: UserTeamPlayerRepository,

    @Inject(PLAYER_REPOSITORY)
    private readonly playerRepository: PlayerRepository,

    @Inject(TRANSFER_BATCH_REPOSITORY)
    private readonly transferBatchRepository: TransferBatchRepository,
  ) {}

  /**
   * 执行并确认一个 TransferBatch。
   *
   * 转会必须满足以下条件：
   * - Fantasy 球队存在且属于当前登录用户。
   * - Gameweek 存在且属于球队所在赛季。
   * - 当前时间早于 Gameweek 的转会截止时间。
   * - 至少包含一笔转会。
   * - 不允许重复卖出或重复买入同一名球员。
   * - 卖出球员必须属于当前有效阵容。
   * - 买入球员不能已经属于当前有效阵容。
   * - 每笔转会的买入和卖出球员必须处于相同位置。
   * - 转会后同一现实俱乐部的球员人数不能超过限制。
   * - 确认转会后的预算余额不能为负。
   *
   * @param userId 当前登录用户的 ID。
   * @param userTeamId 执行转会的 Fantasy 球队 ID。
   * @param input 转会请求，包含 Gameweek ID 和转会列表。
   *
   * @returns 转会结算结果，包括次数、积分成本和预算余额。
   *
   * @throws NotFoundException 球队、比赛日或转会球员不存在。
   * @throws ForbiddenException 当前用户不是球队所有者。
   * @throws BadRequestException 转会请求违反业务规则。
   */
  async execute(
    userId: string,
    userTeamId: string,
    input: ExecuteTransferBatchDto,
  ): Promise<ExecuteTransferBatchResult> {
    // ============================================================
    // 1. Fantasy Team 验证
    // ============================================================

    // 1.1 查询目标 Fantasy 球队
    const userTeam = await this.userTeamRepository.findById(userTeamId);

    // 1.2 球队必须存在
    if (!userTeam) {
      throw new NotFoundException("User team not found");
    }

    // 1.3 只有球队所有者才能执行转会
    if (userTeam.userId !== userId) {
      throw new ForbiddenException("You do not have access to this user team");
    }

    // ============================================================
    // 2. Gameweek 和转会截止时间验证
    // ============================================================

    // 2.1 查询本次转会所属的 Gameweek
    const gameweek = await this.gameweekRepository.findById(input.gameweekId);

    if (!gameweek) {
      throw new NotFoundException("Gameweek not found");
    }

    // 2.2 禁止跨赛季执行转会
    if (gameweek.seasonId !== userTeam.seasonId) {
      throw new BadRequestException(
        "Gameweek does not belong to the user team's season",
      );
    }

    // 2.3 转会必须在 Gameweek deadlineAt 之前确认
    // 当 now >= deadlineAt 时，转会窗口视为关闭
    const now = new Date();

    if (now.getTime() >= gameweek.deadlineAt.getTime()) {
      throw new BadRequestException(
        "Transfer deadline has passed for this gameweek",
      );
    }

    // ============================================================
    // 3. 转会请求参数验证（Pure Input Validation）
    // ============================================================

    // 3.1 一个 TransferBatch 至少需要包含一笔 Transfer
    if (input.transfers.length === 0) {
      throw new BadRequestException("At least one transfer is required");
    }

    // 3.2 提取所有待卖出的球员 ID
    const playerOutIds = input.transfers.map(
      (transfer) => transfer.playerOutId,
    );

    const uniquePlayerOutIds = new Set(playerOutIds);

    // 同一批次不能重复卖出同一名球员
    if (uniquePlayerOutIds.size !== playerOutIds.length) {
      throw new BadRequestException(
        "The same player cannot be transferred out more than once",
      );
    }

    // 3.3 提取所有待买入的球员 ID
    const playerInIds = input.transfers.map((transfer) => transfer.playerInId);

    const uniquePlayerInIds = new Set(playerInIds);

    // 同一批次不能重复买入同一名球员
    if (uniquePlayerInIds.size !== playerInIds.length) {
      throw new BadRequestException(
        "The same player cannot be transferred in more than once",
      );
    }

    // ============================================================
    // 4. 当前阵容验证（Database-State Validation）
    // ============================================================

    // 4.1 查询当前球队所有仍然有效的球员
    // 仅查询 isActive = true 的 UserTeamPlayer
    const activeSquad =
      await this.userTeamPlayerRepository.findActiveByUserTeamId(userTeamId);

    // 使用 Set 提高球员归属检查的效率
    const activePlayerIds = new Set(activeSquad.map((entry) => entry.playerId));

    // 4.2 卖出球员必须属于当前有效阵容
    const hasInvalidPlayerOut = input.transfers.some(
      (transfer) => !activePlayerIds.has(transfer.playerOutId),
    );

    if (hasInvalidPlayerOut) {
      throw new BadRequestException(
        "One or more players to transfer out are not in the active squad",
      );
    }

    // 4.3 买入球员不能已经存在于当前有效阵容中
    const hasInvalidPlayerIn = input.transfers.some((transfer) =>
      activePlayerIds.has(transfer.playerInId),
    );

    if (hasInvalidPlayerIn) {
      throw new BadRequestException(
        "One or more players to transfer in are already in the active squad",
      );
    }

    // ============================================================
    // 5. 球员存在性和位置验证
    // ============================================================

    // 5.1 收集本次转会涉及的所有球员 ID
    const transferPlayerIds = [
      ...input.transfers.map((transfer) => transfer.playerOutId),
      ...input.transfers.map((transfer) => transfer.playerInId),
    ];

    // 5.2 批量查询球员信息，避免逐个查询数据库
    const players = await this.playerRepository.findByIds(transferPlayerIds);

    // 所有参与转会的球员必须存在
    if (players.length !== transferPlayerIds.length) {
      throw new NotFoundException(
        "One or more transfer players were not found",
      );
    }

    // 建立 playerId -> PlayerEntity 的映射
    // 后续可通过 ID 快速读取位置、俱乐部和市场价格
    const playersById = new Map(
      players.map((player) => [player.playerId, player]),
    );

    // 5.3 每笔转会必须保持球员位置不变
    // 例如：FWD -> FWD 合法，FWD -> MID 不合法
    const hasPositionMismatch = input.transfers.some((transfer) => {
      const playerOut = playersById.get(transfer.playerOutId);
      const playerIn = playersById.get(transfer.playerInId);

      return playerOut!.position !== playerIn!.position;
    });

    if (hasPositionMismatch) {
      throw new BadRequestException(
        "Transferred players must have the same position",
      );
    }

    // ============================================================
    // 6. 模拟转会完成后的阵容
    // ============================================================

    // 6.1 获取本次转会需要卖出的所有球员
    const outgoingIds = new Set(
      input.transfers.map((transfer) => transfer.playerOutId),
    );

    // 6.2 从当前有效阵容中移除待卖出球员
    // 保留其余球员的 Player 信息
    const remainingPlayers = activeSquad
      .filter((entry) => !outgoingIds.has(entry.playerId))
      .map((entry) => entry.player)
      .filter((player) => player !== undefined);

    // 6.3 获取本次需要买入的球员
    const incomingPlayers = input.transfers.map(
      (transfer) => playersById.get(transfer.playerInId)!,
    );

    // 6.4 构造转会完成后的模拟阵容
    // 此处只在内存中计算，不修改数据库
    const resultingSquad = [...remainingPlayers, ...incomingPlayers];

    // ============================================================
    // 7. 现实俱乐部人数限制验证
    // ============================================================

    // 7.1 统计模拟阵容中每个 Club 的球员人数
    const playersPerClub = resultingSquad.reduce(
      (counts, player) => {
        counts[player.clubId] = (counts[player.clubId] ?? 0) + 1;

        return counts;
      },
      {} as Record<string, number>,
    );

    // 7.2 检查是否有 Club 超过允许的球员人数
    const exceedsClubLimit = Object.values(playersPerClub).some(
      (count) => count > MAX_PLAYERS_PER_CLUB,
    );

    if (exceedsClubLimit) {
      throw new BadRequestException(
        `Resulting squad cannot contain more than ${MAX_PLAYERS_PER_CLUB} players from the same club`,
      );
    }

    // ============================================================
    // 8. 转会预算结算
    // ============================================================

    // 8.1 计算本次卖出球员获得的总金额
    //
    // 根据当前业务规则：
    // sellPrice = Player.currentPrice
    //
    // 即使球员买入时的 purchasePrice 不同，
    // 卖出时仍然使用当前市场价格。
    const totalSellPrice = input.transfers.reduce((total, transfer) => {
      const playerOut = playersById.get(transfer.playerOutId)!;

      return total.plus(playerOut.currentPrice);
    }, new Prisma.Decimal(0));

    // 8.2 计算本次买入球员需要支付的总金额
    //
    // buyPrice = Player.currentPrice
    const totalBuyPrice = input.transfers.reduce((total, transfer) => {
      const playerIn = playersById.get(transfer.playerInId)!;

      return total.plus(playerIn.currentPrice);
    }, new Prisma.Decimal(0));

    // 8.3 计算确认转会后的预算余额
    //
    // budgetBalanceAfter =
    //   currentBudgetBalance + totalSellPrice - totalBuyPrice
    const budgetBalanceAfter = userTeam.budgetBalance
      .plus(totalSellPrice)
      .minus(totalBuyPrice);

    // 8.4 确认转会时，预算余额不得为负
    // 预算余额等于 0 是允许的
    if (budgetBalanceAfter.lessThan(0)) {
      throw new BadRequestException("Transfer exceeds available budget");
    }

    // ============================================================
    // 9. 免费转会次数和积分成本结算
    // ============================================================

    // 9.1 本批次实际执行的转会次数
    const transfersMade = input.transfers.length;

    // 9.2 当前球队可用的免费转会次数
    const availableFreeTransfers = userTeam.freeTransfers;

    // 9.3 优先消耗免费转会次数
    // 消耗数量不能超过实际转会次数或可用次数
    const freeTransfersUsed = Math.min(availableFreeTransfers, transfersMade);

    // 9.4 超出免费额度的转会属于额外转会
    const paidTransfers = Math.max(0, transfersMade - availableFreeTransfers);

    // 9.5 每次额外转会扣除固定 Fantasy 积分
    //
    // 例如：
    // availableFreeTransfers = 2
    // transfersMade = 3
    // paidTransfers = 1
    // pointsCost = 4
    const pointsCost = paidTransfers * POINTS_PER_EXTRA_TRANSFER;

    // 9.6 计算转会完成后的剩余免费次数
    // 数据库存储的 freeTransfers 不允许为负数
    const freeTransfersAfter = Math.max(
      0,
      availableFreeTransfers - transfersMade,
    );

    // ============================================================
    // 10. 构建最终转会数据
    // ============================================================

    // 10.1 记录本批次的确认时间
    const confirmedAt = new Date();

    // 10.2 为每笔 Transfer 固定卖出和买入价格
    //
    // Transfer 中的 sellPrice / buyPrice 是历史成交价格，
    // 不能在以后查询转会历史时重新使用 Player.currentPrice。
    const transfers = input.transfers.map((transfer) => {
      const playerOut = playersById.get(transfer.playerOutId)!;
      const playerIn = playersById.get(transfer.playerInId)!;

      return {
        playerOutId: transfer.playerOutId,
        playerInId: transfer.playerInId,

        sellPrice: playerOut.currentPrice,
        buyPrice: playerIn.currentPrice,
      };
    });

    // ============================================================
    // 11. 持久化 TransferBatch（Atomic Transaction）
    // ============================================================

    // 委托 TransferBatchRepository 执行数据库事务。
    //
    // Repository 负责：
    // 1. 创建状态为 Confirmed 的 TransferBatch。
    // 2. 创建本批次包含的所有 Transfer 记录。
    // 3. 将卖出球员的 UserTeamPlayer 标记为 inactive。
    // 4. 为买入球员创建新的 active UserTeamPlayer。
    // 5. 更新 UserTeam 的预算余额和免费转会次数。
    // 6. 记录 TransferCreditLedger 的免费次数消耗。
    //
    // 上述数据库操作必须全部成功，否则整个事务回滚。
    await this.transferBatchRepository.executeConfirmedBatch({
      userTeamId,
      gameweekId: input.gameweekId,

      transfers,

      transfersMade,
      pointsCost,

      freeTransfersUsed,
      freeTransfersAfter,

      expectedBudgetBalance: userTeam.budgetBalance,
      expectedFreeTransfers: userTeam.freeTransfers,

      budgetBalanceAfter,

      confirmedAt,
    });

    // ============================================================
    // 12. 返回转会结算结果
    // ============================================================

    // 仅在 Repository 成功完成后返回结果。
    // 返回值用于向 Controller / 前端展示本次转会的结算信息。
    return {
      transfersMade,
      freeTransfersUsed,
      paidTransfers,
      pointsCost,
      freeTransfersAfter,
      budgetBalanceAfter,
    };
  }
}
