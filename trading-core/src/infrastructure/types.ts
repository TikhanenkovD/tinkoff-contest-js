import { createSdk } from "invest-nodejs-grpc-sdk";
import { PortfolioRequest, PortfolioResponse } from "invest-nodejs-grpc-sdk/dist/generated/operations";

import OpenedPosition from "@data/OpenedPosition";
import { Currencies } from "@data/currencies";
import { TradeConfig } from "@shared-kernel/config";


export type Sdk = ReturnType<typeof createSdk>;
export type SdkSandbox = Sdk['sandbox'];
export type SdkOrders = Sdk['orders'];
export type SdkOrdersStream = Sdk['ordersStream'];
export type SdkOperations = Sdk['operations'];

export interface IPositionKeeper {
  /**
   * Get current position by instrument Figi
   * @param figi Instrument Figi
   */
  getHolding(figi: string): OpenedPosition | null;

  /**
   * Get money balance by currency
   * @param currency Currency to get positions for
   */
  getLeftMoney(currency: Currencies): number;

  /**
   * Updates holding share and currencies positions
   * @param figi Instrument Figi
   * @param lots Bought lots
   * @param price Price of the deal
   * @param currency Instrument currency
   * @throws {NotEnoughMoney} If there is not enough money to buy the Instrument
   * @returns {OpenedPosition} Updated Instrument position
   */
  trackBuy(figi: string, lots: number, price: number, currency: Currencies | string, isExecuted: boolean): OpenedPosition;

  /**
   * Updates holding share and currencies positions
   * @param figi Instrument Figi
   * @param lots Sold lots
   * @param price Price of the deal
   * @param currency Share currency
   * @throws {NotFoundException} if share is not found
   * @throws {IvalidDealException} If attempt to sell more lots than holding
   * @returns {OpenedPosition} Updated Instrument position
   */
  trackSell(figi: string, lots: number, price: number, currency: Currencies | string, isExecuted: boolean): OpenedPosition;
}


// TODO: Add docs
export interface IOrderExecutor {
  execute(type: 'buy' | 'sell', figi: string, lots: number, dealPrice: number, currency: Currencies | string): Promise<string | null>;
  subscribeForOrders(): Promise<void>;
}

// TODO: Add docs
export interface IPortfolioProvider {
  getPortfolio: ({ accountId }: PortfolioRequest) => PortfolioResponse | Promise<PortfolioResponse>;
}

// TODO: Add docs
export interface IPortfolioRecoverer {
  recover(watchable: Array<TradeConfig<any>>): void;
}