import logger from '@shared-kernel/logger';
import { TradeConfig, SystemConfig } from '@shared-kernel/config';

import IStrategy from './IStrategy';
import { AvailableStrategies } from './index.types';
import * as strategies from '.';
import { ServiceImplementationsCollection } from '@infrastructure/implementations/servicesFactory';
import { Recoverer } from '@application/account/portfolioRecoverer';



class StrategiesFactory {
  public async assemble(
    systemConfig: SystemConfig, 
    config: Array<TradeConfig<AvailableStrategies>>,
    servicesConstructors: ServiceImplementationsCollection
  ): Promise<Array<IStrategy>> {
    const instances: Array<IStrategy> = [];
    const portfolioProvider = servicesConstructors.PortfolioProvider();
    const portfolioRecoverer = new Recoverer(systemConfig.accountId, portfolioProvider);
    const positionKeeper = await portfolioRecoverer.recover(config);
    const orderExecutor = servicesConstructors.OrdersExecutor(positionKeeper, systemConfig.accountId);
    setInterval(() => {
      orderExecutor.subscribeForOrders();
    }, systemConfig.real.ordersPollingFrequencyMs);
    for (const item of config) {
      const strategies = Object.entries(item.strategies);
      for (const [key, params] of strategies) {
        try {
          const instance = this.createInstance(key, params, positionKeeper, orderExecutor, item);
          logger.info(`Assembled ${key} for ${item.instrumentFigi} with params`, params);
          instances.push(instance);
        } catch (error) {
          if (error instanceof ReferenceError) {
            logger.error(`Strategy ${key} is not found`);
          } else { 
            throw error;
          }
        }
      }

    }
    return instances;
  }

  private createInstance(className: string, ...args): IStrategy  {
    if (!(<any>strategies)[className]) throw new ReferenceError('No strategy to instantiate');
    return new (<any>strategies)[className](...args);
  }
}

export default StrategiesFactory;
