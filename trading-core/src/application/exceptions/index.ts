import { Currencies } from "@data/currencies";

/**
   * Indicates overlimit of money waste
   * @description Occurred when there was an attempt to waste more money than having
   */
export class NotEnoughMoneyException extends Error {
  public attempted: number;
  public actualBalance: number;
  public currency: Currencies = Currencies.UNKNOWN;

  /**
   * @param triedToHold Amount of money that was tried to waste
   * @param currency 
   * @param balance 
   */
  constructor(triedToHold: number, currency: Currencies, balance: number) {
    super(`Attempt to waste ${triedToHold} ${currency} while having ${balance}`);
    this.actualBalance = balance;
    this.attempted = triedToHold;
    this.currency = currency;
  }
}

type Deal = {
  figi: string,
  type: 'buy' | 'sell',
  lots: number,
  extra?: any;
};
export class InvalidDealException extends Error {
  constructor(deal: Deal, extra: any = {}) {
    super(`Invalid deal detected: ${JSON.stringify(deal)} (${JSON.stringify(extra)})`);
  }
}

export class OrderValidationException extends Error {
  constructor(message: string) {
    super(message);
  }
}