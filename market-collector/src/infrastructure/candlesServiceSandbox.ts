import { Candle } from "@shared-kernel/candle";
import { CollectConfig } from "@shared-kernel/config";
import { TinkoffCandle } from "@shared-kernel/tinkoffCandle";
import { CandleInterval } from "invest-nodejs-grpc-sdk/dist/generated/marketdata";
import CandleServiceDto from "./candleServiceDto";
import ICandlesProvider from "./iCandlesProvider";

export default class CandlesServiceSandbox implements ICandlesProvider {
  marketData: any;
  config: CollectConfig;

  constructor(marketData, config) {
    this.marketData = marketData;
    this.config = config;
  }
  /**
   * This function fetch candles and returns in common format
   * @returns Promise<Candle>
   */
  async getCandles(): Promise<Candle> {
    let candle = await this.fetchCandle();
    if (!candle) return null;
    return this.formatCandle(candle);
  }

  /**
   * This function fetch candles and returns in tinkoff candle format
   * @returns Promise<Candle>
   */
  async fetchCandle(): Promise<TinkoffCandle> {
    const res = await this.marketData.getCandles({
      figi: this.config[0].instrumentFigi,
      from: new Date(Date.now() - 1000 * 60 * 5),
      to: new Date(),
      interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
    });
    const candles = res.candles;
    if (Array.isArray(candles) && candles.length) {
      const item = candles.pop();
      item.figi = this.config[0].instrumentFigi;
      return item;
    }
    return null;
  }
  /**
   * This function format candles from tinkoff format to common
   * @returns <Candle>
   */
  formatCandle(candle: TinkoffCandle): Candle {
    return new CandleServiceDto().out(candle);
  }
}
