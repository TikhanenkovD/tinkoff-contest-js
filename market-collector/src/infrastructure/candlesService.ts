import { Candle } from "@shared-kernel/candle";
import { CollectConfig } from "@shared-kernel/config";
import { Queues } from "@shared-kernel/queue";
import { TinkoffCandle } from "@shared-kernel/tinkoffCandle";
import {
  SubscriptionInterval,
  SubscriptionAction,
  MarketDataRequest,
  DeepPartial,
} from "invest-nodejs-grpc-sdk/dist/generated/marketdata";
import CandleServiceDto from "./candleServiceDto";
import QueueService from "./queueService";

export default class CandlesService {
  marketDataStream: any;
  config: CollectConfig[];

  constructor(marketDataStream, config) {
    this.marketDataStream = marketDataStream;
    this.config = config;
  }

  async getCandles() {
    await this.fetchCandles();
  }

  formatCandle(candle: TinkoffCandle): any {
    return new CandleServiceDto().out(candle);
  }

  async fetchCandles() {
    let keepCalling = true;
    setTimeout(function () {
      keepCalling = false;
    }, 5000);
    const timer = (time) => new Promise((resolve) => setTimeout(resolve, time));

    async function* createSubscriptionCandleRequest(
      config: Array<CollectConfig>
    ): AsyncIterable<DeepPartial<MarketDataRequest>> {
      while (keepCalling) {
        await timer(1000);
        yield MarketDataRequest.fromPartial({
          subscribeCandlesRequest: {
            subscriptionAction:
              SubscriptionAction.SUBSCRIPTION_ACTION_SUBSCRIBE,
            instruments: config.map((elem) => {
              return {
                figi: elem.instrumentFigi,
                interval:
                  elem.interval === "1m"
                    ? SubscriptionInterval.SUBSCRIPTION_INTERVAL_ONE_MINUTE
                    : SubscriptionInterval.SUBSCRIPTION_INTERVAL_FIVE_MINUTES,
              };
            }),
          },
        });
      }
    }
    const response = await this.marketDataStream.marketDataStream(
      createSubscriptionCandleRequest(this.config)
    );
    const queueService = new QueueService(Queues.CANDLES);
    for await (const res of response) {
      console.log(JSON.stringify(res, null, 2));
      if (!res.candle) continue;

      let candle = this.formatCandle(res.candle);
      candle = JSON.stringify(candle);
      console.log(candle);
      // queueService.send(candle);
    }
  }
}
