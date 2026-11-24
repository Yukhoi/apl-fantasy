import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../../../prisma/prisma.service";

import {
  ExecuteTransferBatchData,
  TransferBatchRepository,
} from "../../domain/repositories/transfer-batch.repository";

import { TransferBatchEntity } from "../../domain/entities/transfer-batch.entity";

import { TransferBatchStatus, LedgerRefType } from "@prisma/client";

/**
 * PrismaTransferBatchRepository
 *
 * TransferBatchRepository 的 Prisma 实现。
 *
 * 负责将经过 Application Layer 验证和结算的转会批次
 * 持久化到 PostgreSQL 数据库。
 *
 * 主要职责：
 * 1. 创建已确认的 TransferBatch。
 * 2. 创建批次内的所有 Transfer 记录。
 * 3. 将卖出球员从当前有效阵容中移除。
 * 4. 将买入球员添加到当前有效阵容。
 * 5. 更新 Fantasy 球队的预算和免费转会次数。
 * 6. 记录免费转会次数的消耗历史。
 * 7. 将持久化结果映射为 Domain Entity。
 *
 * 架构说明：
 * - 属于 Infrastructure Layer。
 * - 实现 Domain Layer 定义的 TransferBatchRepository 接口。
 * - 通过 PrismaService 与 PostgreSQL 数据库交互。
 * - 不负责重新计算转会价格、预算或积分成本。
 * - 所有数据库写入操作都在同一个 Prisma Transaction 中执行。
 *
 * 事务原则：
 * 所有写入操作必须全部成功，否则整个事务回滚，
 * 避免出现部分球员完成转会但预算没有更新的情况。
 */
@Injectable()
export class PrismaTransferBatchRepository implements TransferBatchRepository {
  /**
   * 注入 PrismaService。
   *
   * @param prisma Prisma 数据库访问服务。
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 执行并持久化一个已确认的 TransferBatch。
   *
   * 此方法接收 Application Layer 已完成业务验证和结算的数据，
   * 并通过 Prisma Interactive Transaction 执行所有数据库写入。
   *
   * 事务包含：
   * 1. 创建 TransferBatch。
   * 2. 创建所有 Transfer 记录。
   * 3. 停用卖出球员的 UserTeamPlayer。
   * 4. 创建买入球员的 UserTeamPlayer。
   * 5. 更新 UserTeam 的预算余额和免费转会次数。
   * 6. 创建 TransferCreditLedger 消耗记录（如果有）。
   *
   * @param data 已验证的转会批次数据及结算结果。
   *
   * @returns 创建成功的 TransferBatchEntity。
   *
   * @throws Error 当卖出球员无法从有效阵容中停用时抛出异常。
   * @throws Prisma 错误 当数据库写入失败或事务无法提交时抛出。
   *
   * @remarks
   * Prisma Transaction 保证数据库写入的原子性。
   * 但当前实现尚未完整解决并发转会导致的状态覆盖问题。
   */
  async executeConfirmedBatch(
    data: ExecuteTransferBatchData,
  ): Promise<TransferBatchEntity> {
    // ============================================================
    // 1. 开启数据库事务（Atomic Transaction）
    // ============================================================

    // 使用 Prisma Interactive Transaction。
    //
    // tx 是当前事务的 Prisma Client。
    // 所有数据库写入必须使用 tx，而不是 this.prisma。
    //
    // 当回调成功完成时，Prisma 尝试提交事务。
    // 如果回调抛出异常，则回滚当前事务中的数据库修改。
    return this.prisma.$transaction(async (tx) => {
      // ==========================================================
      // 2. 创建 TransferBatch
      // ==========================================================

      // 创建本次转会批次的主记录。
      //
      // 一个 TransferBatch 代表用户的一次完整转会提交，
      // 可以包含一笔或多笔 Transfer。
      //
      // 当前 MVP 不经过 Draft 阶段，
      // 因此创建时直接设置为 Confirmed。
      //
      // transfersMade：本批次转会总次数。
      // pointsCost：超出免费额度产生的 Fantasy 积分成本。
      // budgetBalanceAfter：转会确认后的预算余额。
      const batch = await tx.transferBatch.create({
        data: {
          userTeamId: data.userTeamId,
          gameweekId: data.gameweekId,

          status: TransferBatchStatus.Confirmed,
          confirmedAt: data.confirmedAt,

          transfersMade: data.transfersMade,
          pointsCost: data.pointsCost,

          budgetBalanceAfter: data.budgetBalanceAfter,
        },
      });

      // ==========================================================
      // 3. 创建 Transfer 明细记录
      // ==========================================================

      // 一个 Transfer 代表一笔具体的球员交换：
      // 卖出 playerOutId，买入 playerInId。
      //
      // 所有 Transfer 通过 transferBatchId 关联到同一批次。
      //
      // sellPrice / buyPrice 是确认转会时的成交价格，
      // 用于保存历史记录。
      //
      // 这些价格已经由 UseCase 根据 Player.currentPrice 计算，
      // Repository 不再重新计算。
      //
      // 使用 createMany 批量写入，提高数据库操作效率。
      await tx.transfer.createMany({
        data: data.transfers.map((transfer) => ({
          transferBatchId: batch.transferBatchId,
          playerOutId: transfer.playerOutId,
          playerInId: transfer.playerInId,
          sellPrice: transfer.sellPrice,
          buyPrice: transfer.buyPrice,
        })),
      });

      // ==========================================================
      // 4. 停用所有卖出球员
      // ==========================================================

      // 对每笔 Transfer，找到当前球队中对应的有效球员记录。
      //
      // UserTeamPlayer 不直接删除，因为需要保留历史：
      // - 当时的 purchasePrice
      // - 加入球队的 joinedAt
      // - 离开球队的 leftAt
      //
      // 卖出时：
      // isActive: true -> false
      // leftAt: null -> confirmedAt
      for (const transfer of data.transfers) {
        const result = await tx.userTeamPlayer.updateMany({
          where: {
            userTeamId: data.userTeamId,
            playerId: transfer.playerOutId,
            isActive: true,
          },
          data: {
            isActive: false,
            leftAt: data.confirmedAt,
          },
        });

        // 每笔转会必须恰好停用一条有效阵容记录。
        //
        // count = 0：
        // 球员可能已经被卖出，或当前不属于有效阵容。
        //
        // count > 1：
        // 数据中可能存在重复的有效球员记录。
        //
        // 两种情况都属于异常状态，必须终止整个事务。
        //
        // 抛出异常后，之前创建的 TransferBatch 和 Transfer
        // 也会随着数据库事务回滚。
        if (result.count !== 1) {
          throw new Error(
            `Failed to deactivate outgoing player ${transfer.playerOutId}`,
          );
        }
      }

      // ==========================================================
      // 5. 创建所有买入球员的阵容记录
      // ==========================================================

      // 为每名买入球员创建新的 UserTeamPlayer。
      //
      // purchasePrice 使用本次转会的 buyPrice，
      // 而不是未来可能发生变化的 Player.currentPrice。
      //
      // 新买入球员：
      // - isActive = true
      // - joinedAt = confirmedAt
      // - leftAt 使用 Prisma Schema 定义的默认值
      //
      // 使用 createMany 批量创建所有买入记录。
      await tx.userTeamPlayer.createMany({
        data: data.transfers.map((transfer) => ({
          userTeamId: data.userTeamId,
          playerId: transfer.playerInId,
          purchasePrice: transfer.buyPrice,
          isActive: true,
          joinedAt: data.confirmedAt,
        })),
      });

      // ==========================================================
      // 6. 并发更新 Fantasy Team 的资源状态
      // ==========================================================

      // 将本次转会的结算结果写回 UserTeam。
      //
      // budgetBalance：
      // 当前预算 + 卖出总价 - 买入总价。
      //
      // freeTransfers：
      // 消耗免费转会次数后的剩余数量，不允许为负。
      //
      // 以上数值已经由 ExecuteTransferBatchUseCase 计算，
      // 此处只负责持久化。
      const updateResult = await tx.userTeam.updateMany({
        where: {
          userTeamId: data.userTeamId,

          // UseCase 读取时的状态
          budgetBalance: data.expectedBudgetBalance,
          freeTransfers: data.expectedFreeTransfers,
        },
        data: {
          budgetBalance: data.budgetBalanceAfter,
          freeTransfers: data.freeTransfersAfter,
        },
      });

      if (updateResult.count !== 1) {
        throw new Error("User team state has changed concurrently");
      }

      // ==========================================================
      // 7. 记录免费转会次数的消耗
      // ==========================================================

      // TransferCreditLedger 用于记录免费转会次数的变化历史。
      //
      // delta 为负数表示消耗：
      // freeTransfersUsed = 1 -> delta = -1
      // freeTransfersUsed = 2 -> delta = -2
      //
      // 当没有使用免费转会次数时，不创建消耗记录。
      //
      // refType 和 refId 将本条 Ledger 与对应的
      // TransferBatch 关联，便于追踪转会次数变化的来源。
      //
      // 注意：
      // 此 Ledger 记录的是免费转会次数，不是 Fantasy 积分。
      // 额外转会产生的积分成本保存在 TransferBatch.pointsCost。
      if (data.freeTransfersUsed > 0) {
        await tx.transferCreditLedger.create({
          data: {
            userTeamId: data.userTeamId,
            gameweekId: data.gameweekId,

            delta: -data.freeTransfersUsed,
            reason: "TRANSFER_USAGE",

            refType: LedgerRefType.TransferBatch,
            refId: batch.transferBatchId,
          },
        });
      }

      // ==========================================================
      // 8. 映射并返回 Domain Entity
      // ==========================================================

      // 将 Prisma 返回的数据库记录转换为 Domain Entity。
      //
      // Domain Entity 不依赖 Prisma Model，
      // 从而保持 Domain Layer 与 Infrastructure Layer 解耦。
      //
      // 返回值由 Prisma Transaction 回调返回。
      // 当事务成功提交后，executeConfirmedBatch 才会完成。
      return new TransferBatchEntity(
        batch.transferBatchId,
        batch.userTeamId,
        batch.gameweekId,
        batch.status,
        batch.createdAt,
        batch.confirmedAt,
        batch.transfersMade,
        batch.pointsCost,
        batch.budgetBalanceAfter,
      );
    });
  }
}
