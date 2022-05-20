import { randomUUID } from 'crypto';
import { OrderDirection, OrderState, OrderType } from "invest-nodejs-grpc-sdk/dist/generated/orders";

import logger from "@shared-kernel/logger";
import { qToNum, numberToQ } from "@lib/helpers";
import Order from "@data/order";
import metricsLogger from "@infrastructure/metricsLogger";
import { IOrderExecutor, IPositionKeeper, SdkSandbox } from "@infrastructure/types";
import Metrics from "@application/metrics";
import { OrderValidationException } from "@application/exceptions";


/**
 * Pre-processes order before execution
 * Must return order to execute, if no value returned, previous order will be executed.
 * @description Throw OrderValidationException to prevent order execution. Will be called in context of OrderExecutor
 * @throws {OrderValidationException}
 * @returns {Order} To execute
 */
export type OrderExecuteMiddleware = (order: Order) => Promise<Order>;

// TODO: Add docs
class OrderExecutor implements IOrderExecutor {
  private readonly sdk: SdkSandbox;
  private readonly positionKeeper: IPositionKeeper;
  private readonly middlewares: OrderExecuteMiddleware[] = [];
  private readonly accountId: string;

  private isUpdating = false;
  private readonly watchingOrders: Record<string, any> = {};
  private readonly trackedOrdersStages: Record<string, string> = {};

  constructor(sdk: SdkSandbox, positionKeeper: IPositionKeeper, accountId: string) {
    if (!positionKeeper) throw new TypeError('sdk is required')
    this.positionKeeper = positionKeeper;

    if (!sdk) throw new TypeError('sdk is required')
    this.sdk = sdk;

    if (!accountId) throw new TypeError('accountId is required')
    this.accountId = accountId;

    setInterval(this.subscribeForOrders.bind(this), 400);
  }

  public set middleware(middleware: OrderExecuteMiddleware) {
    this.middlewares.push(middleware);
  }

  public async execute(type: "buy" | "sell", figi: string, lots: number, dealPrice: number): Promise<string | null> {
    try {
      let order = { type, figi, lots, dealPrice };
  
      for await (const mwr of this.middlewares) {
        const tmp = await mwr.call(this, order);
        if (tmp) {
          order = tmp;
        }
      }

      const orderId = randomUUID();
      // TODO: Move out to DTO
      const placedOrder = await this.sdk.postSandboxOrder({
        figi: order.figi,
        quantity: order.lots,
        direction: order.type === "buy"
          ? OrderDirection.ORDER_DIRECTION_BUY
          : OrderDirection.ORDER_DIRECTION_SELL,
        orderId,
        price: numberToQ(order.dealPrice),
        accountId: this.accountId,
        orderType: OrderType.ORDER_TYPE_LIMIT,
      });

      if (placedOrder.orderId !== orderId) {
        metricsLogger.track(Metrics.orders.idMismatch, orderId, placedOrder);
        logger.error(`Orders id mismatch: ${placedOrder.orderId} !== ${orderId}`);
      }

      this.watchingOrders[placedOrder.orderId] = placedOrder;
  
      return placedOrder.orderId;
    } catch (e) {
      if (e.constructor == OrderValidationException) {
        logger.error('Order execution failed', e);
        metricsLogger.track(Metrics.orders.executionFailed, type, figi, lots, dealPrice, e);
        return null;
      } else {
        logger.error('OrderExecutor.execute()', e);
        throw e;
      }
    }
  }

  public async subscribeForOrders(accountId: string = this.accountId): Promise<void> {
    try {
      if (this.isUpdating) return;
      this.isUpdating = true;
      const { orders }: { orders: OrderState[] } = await this.sdk.getSandboxOrders({ accountId });

      const controlledOrders = orders.filter((o: OrderState) => this.watchingOrders[o.orderId]);

      for (const order of controlledOrders) {
        const latestStage = order.stages[order.stages.length - 1];

        // If there was a trade that we have not tracked yet - we should update position
        // Using stages instead of executedLots we guarantee more atomic and reactive updates of position
        if (!this.trackedOrdersStages[order.orderId]
          || this.trackedOrdersStages[order.orderId] !== latestStage.tradeId) {
          const isSell = order.direction === OrderDirection.ORDER_DIRECTION_SELL;
          const isBuy = order.direction === OrderDirection.ORDER_DIRECTION_BUY;
          const unknownOrder = !isSell && !isBuy;

          if (isSell) {
            this.positionKeeper.trackSell(
              order.figi,
              latestStage.quantity,
              qToNum(latestStage.price),
              latestStage.price.currency,
              true,
            );
            this.trackedOrdersStages[order.orderId] = latestStage.tradeId;
          } else if (isBuy) {
            this.positionKeeper.trackBuy(
              order.figi,
              latestStage.quantity,
              qToNum(latestStage.price),
              latestStage.price.currency,
              true,
            );
            this.trackedOrdersStages[order.orderId] = latestStage.tradeId;
          }

          if (unknownOrder) {
            metricsLogger.track(Metrics.orders.unknownType, order);
          }
        }
      }
    } catch (e) {
        logger.error('OrderExecutor.subscribeForOrders()', e);
    } finally {
      this.isUpdating = false;
    }
  }

}

export default OrderExecutor;
