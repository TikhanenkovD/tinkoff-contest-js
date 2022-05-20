import { Candle } from "@shared-kernel/candle";

export default interface IStrategy {
  consume(candle: Candle): void;
}