import { IPortfolioProvider, SdkOperations } from "@infrastructure/types";

class PortfolioProvider implements IPortfolioProvider {
  private readonly sdk: SdkOperations;

  constructor(sdk) {
    if (!sdk) throw new TypeError('sdk is required');

    this.sdk = sdk;
  }

  public async getPortfolio({ accountId }) {
    return this.sdk.getPortfolio({ accountId });
  }
}

export default PortfolioProvider;
