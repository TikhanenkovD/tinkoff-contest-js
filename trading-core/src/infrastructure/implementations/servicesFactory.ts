import * as types from '@infrastructure/types';
import { PortfolioProviderSandbox, OrdersExecutorSandbox } from "./sandbox";
import { OrdersExecutor, PortfolioProvider } from './real';


export type ServiceImplementationsCollection = {
  PortfolioProvider: (...args: any) => types.IPortfolioProvider;
  OrdersExecutor: (...args: any) => types.IOrderExecutor;
}

// TODO: Add docs
class ServicesFactory {
  private readonly sdk: types.Sdk;

  constructor(sdk) {
    if (!sdk) throw new TypeError('sdk is required');

    this.sdk = sdk;
  }

  // TODO: Add docs
  public assemble(isSandbox: boolean): ServiceImplementationsCollection {
    return isSandbox ? this.assembleSandbox() : this.assembleReal();
  }

  // TODO: Add docs
  private assembleSandbox(): ServiceImplementationsCollection {
    return {
      PortfolioProvider: () => new PortfolioProviderSandbox(this.sdk.sandbox),
      OrdersExecutor: (positionKeeper: types.IPositionKeeper, accountId: string) => new OrdersExecutorSandbox(
        this.sdk.sandbox,
        positionKeeper,
        accountId,
      ),
    }
  }

  // TODO: Add docs
  private assembleReal(): ServiceImplementationsCollection {
    return {
      PortfolioProvider: () => new PortfolioProvider(this.sdk.operations),
      OrdersExecutor: (positionKeeper: types.IPositionKeeper, accountId: string) => new OrdersExecutor(
        this.sdk.orders,
        this.sdk.ordersStream,
        positionKeeper,
        accountId,
      ),
    }
  }
}

export default ServicesFactory;
