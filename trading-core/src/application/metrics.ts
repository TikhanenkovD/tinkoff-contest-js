const Metrics = {
  candles: {
    received: Symbol.for('candles.received'),
    invalidCandleReceived: Symbol.for('candles.invalidCandleReceived'),
  },
  orders: {
    unknownType: Symbol.for('orders.unknown-type'),
    executionFailed: Symbol.for('orders.execution-failed'),
    place: Symbol.for('orders.place'),
    idMismatch: Symbol.for('orders.id-mismatch'),
  },
  deals: {
    notEnoughMoney: Symbol.for('balance.not-enough-money'),
    invalid: Symbol.for('deals.invalid'),
  },
  strategies: {
    consume: Symbol.for('strategies.consume'),
    decidedToSell: Symbol.for('strategies.decided-to-sell'),
    decidedToBuy: Symbol.for('strategies.decided-to-buy'),
    idleCandle: Symbol.for('strategies.idle-candle'), 
    error: Symbol.for('strategies.error'),
  }
};

export default Metrics;