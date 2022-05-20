import { Currencies } from "@data/currencies";
import OpenedPosition from "@data/OpenedPosition";
import metricsLogger from "@infrastructure/metricsLogger";
import { IPositionKeeper } from "@infrastructure/types";
import logger from '@shared-kernel/logger';
import { InvalidDealException, NotEnoughMoneyException } from "./exceptions";
import Metrics from "./metrics";

class PositionKeeper implements IPositionKeeper {
  private readonly holdingShares: Record<string, OpenedPosition> = {};
  private readonly balances: Record<Currencies, number> = {} as any;
  private readonly operatingShares: Record<string, number> = {};
  private readonly operatingMoney: Record<Currencies, number> = {} as any;

  constructor(initialShares: Record<string, OpenedPosition>, initialBalances: Record<Currencies, number>) {
    this.holdingShares = initialShares;
    this.balances = initialBalances;
    logger.info('Initial portfolio', this.holdingShares);
    logger.info('Initial balances', this.balances);
  }

  // TODO: Make it more like Transactions
  // TODO: Handle case whe Currency is String
  trackBuy(figi: string, lots: number, price: number, currency: Currencies, isExecuted: boolean = false): OpenedPosition {
    try {
      if (!isExecuted) {
        logger.info(`Attempt to buy ${lots} lots of ${figi} at ${price}`);
        if (!this.balances[currency]
          || this.balances[currency] < price
          || this.balances[currency] - this.operatingMoney[currency] || 0 < price) {
            metricsLogger.track(Metrics.deals.notEnoughMoney, {
              price,
              currency,
              balance: this.balances[currency],
            });
          throw new NotEnoughMoneyException(price, currency, this.balances[currency]);
        }
      }

      if (!this.operatingMoney[currency]) this.operatingMoney[currency] = 0;
      this.operatingMoney[currency] += price;

      if (!this.holdingShares[figi]) this.holdingShares[figi] = {
        figi,
        quantityLots: 0,
        currency,
      };
      this.holdingShares[figi].quantityLots += lots;

      this.operatingMoney[currency] -= price;
      this.balances[currency] -= price;
    } catch (e) {
      logger.error(e);
      throw e;
    } finally {
      return this.holdingShares[figi] || null;
    }
  }

  trackSell(figi: string, lots: number, price: number, currency: Currencies, isExecuted: boolean = false): OpenedPosition {
    try {
      if (!isExecuted) {
        logger.info(`Attempt to sell ${lots} lots of ${figi} at ${price}`);
        if (!this.holdingShares[figi]
          || this.holdingShares[figi].quantityLots < lots
          || this.holdingShares[figi].quantityLots - this.operatingShares[figi] || 0 < lots) {
          metricsLogger.track(Metrics.deals.invalid, {
            type: 'sell',
            figi,
            lots,
            holding: this.holdingShares[figi],
            operating: this.operatingShares[figi],
          });
          throw new InvalidDealException(
            { type: 'sell', figi, lots },
            { holding: this.holdingShares[figi], operating: this.operatingShares[figi] },
          );
        }
      }

      if (!this.operatingShares[figi]) this.operatingShares[figi] = 0;
      this.operatingShares[figi] += lots;

      this.holdingShares[figi].quantityLots -= lots;
      this.balances[currency] += price;
      this.operatingShares[figi] -= lots;
    } catch (e) {
      logger.error(e);
      throw e;
    } finally {
      return this.holdingShares[figi];
    }
  }

  getHolding(figi: string): OpenedPosition {
    return this.holdingShares[figi] || { quantityLots: 0, figi, currency: null };
  }
  getLeftMoney(currency: Currencies): number {
    return this.balances[currency] || 0;
  }
}

export default PositionKeeper;
