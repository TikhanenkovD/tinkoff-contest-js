import logger from '@shared-kernel/logger';
import { Currencies } from "@data/currencies";
import { qToNum } from '@lib/helpers';
import type { IPortfolioProvider, IPortfolioRecoverer } from '@infrastructure/types';
import currenciesMap from '@infrastructure/currenciesMap';
import PositionKeeper from "../positionKeeper";
import { TradeConfig } from '@shared-kernel/config';


export class Recoverer implements IPortfolioRecoverer {
  private accountId;
  private requester: IPortfolioProvider;

  constructor(accountId: string, requestClient: IPortfolioProvider) {
    this.accountId = accountId;
    this.requester = requestClient;
  }

  async recover(watchable: Array<TradeConfig<any>>): Promise<PositionKeeper> {
    try {
      const portfolio = await this.requester.getPortfolio({ accountId: this.accountId });
      const parsedPortfolio = {
        currencies: {},
        shares: {},
      };

      for (const position of portfolio.positions) {
        switch (position.instrumentType) {
          case 'currency':
            const currency: Currencies = currenciesMap[position.figi];
            if (!parsedPortfolio.currencies[currency]) {
              parsedPortfolio.currencies[currency] = 0;
            }

            parsedPortfolio.currencies[currency] += qToNum(position.quantity);
            break;
          case 'share':
            const watch = watchable.find(item => item.instrumentFigi === position.figi);
            if (watch) {
              parsedPortfolio.shares[position.figi] = {
                figi: position.figi,
                quantity: qToNum(position.quantity),
                currency: Currencies[watch.currency] || Currencies.UNKNOWN,
                quantityLots: position.quantityLots ? qToNum(position.quantityLots) : 1,
                lotSize: watch.lotSize,
              }
            } else {
              logger.warn(`Found not processable instrument in portfolio ${position.figi}`);
            }
            break;
          default:
            logger.warn('Unknown instrument type', position.instrumentType);
            break;
        }
      }

      return new PositionKeeper(parsedPortfolio.shares, parsedPortfolio.currencies as any);
    } catch (e) {
      logger.error(e);
      return null;
    }
  }
}