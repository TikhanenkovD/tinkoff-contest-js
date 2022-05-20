export interface IConsumer<T> {
  consume(item: T): void;
}

type Candle = import("@shared-kernel/candle").Candle;

export class CandlesPool implements IConsumer<Candle> {
  private candles: Record<string, Candle> = {};
  private candlesProxy;
  private subscribers: IConsumer<Candle>[];

  constructor(subscribers: IConsumer<Candle>[]) {
    this.onAddCandle = this.onAddCandle.bind(this);
    this.consume = this.consume.bind(this);
    this.subscribers = subscribers;

    const set = function (target, p, value) {
      target[p] = value;
      this.onAddCandle(target, p, value);
      return true;
    }.bind(this);

    this.candlesProxy = new Proxy(this.candles, {
      set,
    });
  }

  public consume(item: Candle): void {
    const timeKey: any = item.Time.toString();
    const noSuchCandle = !this.candles[timeKey];
    if (noSuchCandle) {
      this.candlesProxy[timeKey] = item;
    }
  }

  private async onAddCandle(
    all: any,
    time: string,
    candle: Candle
  ): Promise<void> {
    const subscribePromises = this.subscribers.map((subscriber) =>
      subscriber.consume(candle)
    );
    await Promise.allSettled(subscribePromises);
  }
}
