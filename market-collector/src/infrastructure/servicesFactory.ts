import { createSdk } from "invest-nodejs-grpc-sdk";

import CandlesServiceSandbox from "@infrastructure/candlesServiceSandbox";
import CandlesService from "@infrastructure/candlesService";
import ICandlesProvider from "./iCandlesProvider";
import { CollectConfig } from "@shared-kernel/config";

export type ServiceImplementationsCollection = {
  CandlesService: (...args: any) => any; //ICandlesProvider;
};

// TODO: Add docs
class ServicesFactory {
  private readonly sdk: any;
  config: CollectConfig;

  constructor(sdk: ReturnType<typeof createSdk>, config) {
    if (!sdk) throw new TypeError("sdk is required");

    this.sdk = sdk;
    this.config = config;
  }

  // TODO: Add docs
  public assemble(isSandbox: boolean): ServiceImplementationsCollection {
    return isSandbox ? this.assembleSandbox() : this.assembleReal();
  }

  // TODO: Add docs
  private assembleSandbox(): ServiceImplementationsCollection {
    return {
      CandlesService: () =>
        new CandlesServiceSandbox(this.sdk.marketData, this.config),
    };
  }

  // TODO: Add docs
  private assembleReal(): ServiceImplementationsCollection {
    return {
      CandlesService: () =>
        new CandlesService(this.sdk.marketDataStream, this.config),
    };
  }
}

export default ServicesFactory;
