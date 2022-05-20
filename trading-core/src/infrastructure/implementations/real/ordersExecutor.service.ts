import { randomUUID } from 'crypto';
import { OrderDirection, OrderState, OrderType } from "invest-nodejs-grpc-sdk/dist/generated/orders";

import logger from "@shared-kernel/logger";
import { numberToQ, qToNum } from "@lib/helpers";
import Order from "@data/order";
import metricsLogger from "@infrastructure/metricsLogger";
import currenciesMap from '@infrastructure/currenciesMap';
import { IOrderExecutor, IPositionKeeper, SdkOrders, SdkOrdersStream } from "@infrastructure/types";
import Metrics from "@application/metrics";
import { OrderValidationException } from "@application/exceptions";
import { Currencies } from '@data/currencies';


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
  private readonly sdk: SdkOrders;
  private readonly sdkStream: SdkOrdersStream;
  private readonly positionKeeper: IPositionKeeper;
  private readonly middlewares: OrderExecuteMiddleware[] = [];
  private readonly accountId: string;

  private readonly watchingOrders: Record<string, any & { currency: Currencies }> = {};
  private readonly trackedOrdersStages: Record<string, string> = {};

  constructor(sdk: SdkOrders, sdkStream: SdkOrdersStream, positionKeeper: IPositionKeeper, accountId: string) {
    if (!positionKeeper) throw new TypeError('positionKeeper is required')
    this.positionKeeper = positionKeeper;

    if (!sdk) throw new TypeError('sdk is required')
    this.sdk = sdk;

    if (!sdkStream) throw new TypeError('sdkStream is required')
    this.sdkStream = sdkStream;

    if (!accountId) throw new TypeError('accountId is required')
    this.accountId = accountId;

    this.subscribeForOrders = this.subscribeForOrders.bind(this);
  }

  public set middleware(middleware: OrderExecuteMiddleware) {
    this.middlewares.push(middleware);
  }

  public async execute(
    type: "buy" | "sell",
    figi: string,
    lots: number,
    dealPrice: number,
    currency: Currencies | string,
  ): Promise<string | null> {
    try {
      let order = { type, figi, lots, dealPrice };
      currency = Currencies[currency] || currenciesMap[currency]; 
  
      for await (const mwr of this.middlewares) {
        const tmp = await mwr.call(this, order);
        if (tmp) {
          order = tmp;
        }
      }

      const orderId = randomUUID();
      // TODO: Move out to DTO
      const placedOrder = await this.sdk.postOrder({
        accountId: this.accountId,
        figi: order.figi,
        direction: order.type === "buy"
          ? OrderDirection.ORDER_DIRECTION_BUY
          : OrderDirection.ORDER_DIRECTION_SELL,
        quantity: order.lots,
        price: numberToQ(order.dealPrice),
        orderType: OrderType.ORDER_TYPE_LIMIT,
        orderId,
      });

      if (placedOrder.orderId !== orderId) {
        metricsLogger.track(Metrics.orders.idMismatch, orderId, placedOrder);
        logger.error(`Orders id mismatch: ${placedOrder.orderId} !== ${orderId}`);
      }

      metricsLogger.track(Metrics.orders.place, placedOrder);
      this.watchingOrders[placedOrder.orderId] = placedOrder;
      this.watchingOrders[placedOrder.orderId].currency = currency;
  
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

  public async subscribeForOrders(): Promise<void> {
    try {
      const accountId = this.accountId;
      const { orders } = await this.sdk.getOrders({ accountId });
      for await (const order of orders) {
        const latestTrade = order.stages[order.stages.length - 1];

        // Means that order not yet processed
        if (!latestTrade) continue;
        // If there was a trade that we have not tracked yet - we should update position
        // Using stages instead of executedLots we guarantee more atomic and reactive updates of position
        if (!this.trackedOrdersStages[order.orderId]
          || this.trackedOrdersStages[order.orderId] !== latestTrade.tradeId) {
          const isSell = order.direction === OrderDirection.ORDER_DIRECTION_SELL;
          const isBuy = order.direction === OrderDirection.ORDER_DIRECTION_BUY;
          const isUnknown = !isSell && !isBuy;

          const currency = this.watchingOrders[order.orderId]?.currency;
          if (isSell) {
            this.positionKeeper.trackSell(
              order.figi,
              latestTrade.quantity,
              qToNum(latestTrade.price),
              currency,
              true,
            );
            this.trackedOrdersStages[order.orderId] = latestTrade.tradeId;
          } else if (isBuy) {
            this.positionKeeper.trackBuy(
              order.figi,
              latestTrade.quantity,
              qToNum(latestTrade.price),
              currency,
              true,
            );
            this.trackedOrdersStages[order.orderId] = latestTrade.tradeId;
          }

          if (isUnknown) {
            metricsLogger.track(Metrics.orders.unknownType, order);
          }
        }
      }
    } catch (e) {
      logger.error('OrderExecutor.subscribeForOrders()', e);
    }
  }

  public async subscribeForOrdersStream(): Promise<void> {
    try {
      const accountId = this.accountId;
      const toSubscribe = await this.sdkStream.tradesStream({ accountId });
      for await (const trade of toSubscribe) {
        if (!trade.orderTrades) continue;

        const order = trade.orderTrades;
        const latestTrade = order.trades[order.trades.length - 1];

        // If there was a trade that we have not tracked yet - we should update position
        // Using stages instead of executedLots we guarantee more atomic and reactive updates of position
        if (!this.trackedOrdersStages[order.orderId]
          || this.trackedOrdersStages[order.orderId] !== latestTrade.dateTime.toString()) {
          const isSell = order.direction === OrderDirection.ORDER_DIRECTION_SELL;
          const isBuy = order.direction === OrderDirection.ORDER_DIRECTION_BUY;
          const isUnknown = !isSell && !isBuy;

          const currency = this.watchingOrders[order.orderId].currency;
          if (isSell) {
            this.positionKeeper.trackSell(
              order.figi,
              latestTrade.quantity,
              qToNum(latestTrade.price),
              currency,
              true,
            );
            this.trackedOrdersStages[order.orderId] = latestTrade.dateTime.toString();
          } else if (isBuy) {
            this.positionKeeper.trackBuy(
              order.figi,
              latestTrade.quantity,
              qToNum(latestTrade.price),
              currency,
              true,
            );
            this.trackedOrdersStages[order.orderId] = latestTrade.dateTime.toString();
          }

          if (isUnknown) {
            metricsLogger.track(Metrics.orders.unknownType, order);
          }
        }
      }
    } catch (e) {
      logger.error('OrderExecutor.subscribeForOrders()', e);
    }
  }
}

export default OrderExecutor;
