import type { Candle } from "@shared-kernel/candle";

export default interface ICandlesProvider {
  getCandles(): Promise<Candle | null>;
}