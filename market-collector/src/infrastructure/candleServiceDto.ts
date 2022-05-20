import qToNum from "@/lib/candleFormatter";
import { Candle } from "@shared-kernel/candle";
import { TinkoffCandle } from "@shared-kernel/tinkoffCandle";

export default class CandleServiceDto {
  in() {
    throw new Error("not implemented!");
  }

  out(payload: TinkoffCandle): Candle {
    return {
      C: qToNum(payload.close),
      O: qToNum(payload.open),
      H: qToNum(payload.high),
      L: qToNum(payload.low),
      V: payload.volume,
      Time: payload.time,
      Figi: payload.figi,
      Currency: "USD",
    };
  }
}
