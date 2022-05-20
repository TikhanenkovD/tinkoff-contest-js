import * as strategies from '.';

export type BaseStrategyParams = {
  availaBleMoney: number;
}

export type SimpleStrategyParams = BaseStrategyParams & {
  minimalPriceGap: number;
  maxHoldingShares?: number;
  sellSharesStep?: number;
}


/**
 * Represents set of implemented strategies
 * @description Add new type here when implement new strategy
 */
type AllParams = SimpleStrategyParams;


export type AvailableStrategies = {
  [key in keyof typeof strategies]: AllParams;
}