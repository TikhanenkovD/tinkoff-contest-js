import { Candle } from "@shared-kernel/candle";
import { Currencies } from "@data/currencies";
import logger from '@shared-kernel/logger';

import { IPositionKeeper, IOrderExecutor } from "@infrastructure/types";
import IStrategy from "./IStrategy";
import Strategy from "./strategy";
import { SimpleStrategyParams } from './index.types';
import metricsLogger from "@infrastructure/metricsLogger";
import Metrics from "@application/metrics";


// TODO: Add docs
class SimpleStrategy extends Strategy implements IStrategy {
  private lastBuyPrice = -Infinity;
  private lastSellPrice = 0;
  private params: SimpleStrategyParams;

  /**
   * Normalizes parameters to simplify work with them further
   */
  private set Params (candidate: SimpleStrategyParams) {
    this.params = candidate;
    if (!this.params.sellSharesStep) {
      this.params.sellSharesStep = 1;
    }
    if (!this.params.maxHoldingShares) {
      this.params.maxHoldingShares = Infinity;
    }
  }

  constructor(params, ...args: [IPositionKeeper, IOrderExecutor]) {
    super(...args);
    this.Params = params;
  }

  async consume(candle: Candle): Promise<void> {
    try {
      if (candle.L < this.lastBuyPrice) {
        const holdingAmount = this.positionsKeeper.getHolding(candle.Figi);
        const money = this.positionsKeeper.getLeftMoney(candle.Currency as Currencies)
      
        const holdsLess = holdingAmount.quantityLots < this.params.maxHoldingShares;
        const hasEnoughMoney = candle.L * holdingAmount.quantityLots <= money;
        if (holdsLess && hasEnoughMoney) {
          const buyLots = this.params.maxHoldingShares - holdingAmount.quantityLots
          const dealPrice = candle.L * buyLots;
  
          logger.info(`SimpleStrategy: buy ${buyLots} lots of ${candle.Figi}`
            + ` for ${candle.L} ${candle.Currency} per lot. Deal price ${dealPrice}`);
  
          metricsLogger.track(Metrics.strategies.decidedToBuy, { candle, dealPrice, buyLots, holdingAmount, money });
          await this.orderExecutor.execute(
            'buy',
            candle.Figi,
            buyLots,
            dealPrice,
            candle.Currency,
          );
        }
      } else if (candle.H > this.lastSellPrice) {
        const holdingAmount = this.positionsKeeper.getHolding(candle.Figi);
        const holdsEnough = holdingAmount.quantityLots >= this.params.sellSharesStep;
        if (holdsEnough) {
          const dealPrice = candle.H * holdingAmount.quantityLots;
  
          logger.info(`SimpleStrategy: sell ${holdingAmount.quantityLots} lots of ${candle.Figi}`
            + ` for ${candle.H} ${candle.Currency} per lot. Deal price ${dealPrice}`);
  
          metricsLogger.track(Metrics.strategies.decidedToSell, { candle, dealPrice, holdingAmount });
          await this.orderExecutor.execute(
            'sell',
            candle.Figi,
            holdingAmount.quantityLots,
            dealPrice,
            candle.Currency,
          );
        }
      } else {
        console.log('82 simple', 'idle');
        metricsLogger.track(Metrics.strategies.idleCandle, {
          candle,
          holding: this.positionsKeeper.getHolding(candle.Figi),
          lastBuyPrice: this.lastBuyPrice,
          lastSellPrice: this.lastSellPrice,
          money: this.positionsKeeper.getLeftMoney(candle.Currency as Currencies),
        });
      }
    } catch (error) {
      metricsLogger.track(Metrics.strategies.error, { candle, error, params: this.params });
      logger.error(error);
    }
  }
}

export default SimpleStrategy;