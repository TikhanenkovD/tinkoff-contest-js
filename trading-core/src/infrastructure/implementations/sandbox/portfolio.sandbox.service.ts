import { IPortfolioProvider, SdkSandbox } from "@infrastructure/types";

class PortfolioProviderSandbox implements IPortfolioProvider {
  private readonly sdk: SdkSandbox;

  constructor(sdk) {
    if (!sdk) throw new TypeError('sdk is required');

    this.sdk = sdk;
  }

  public async getPortfolio({ accountId }) {
    return this.sdk.getSandboxPortfolio({ accountId });
  }
}

export default PortfolioProviderSandbox;
