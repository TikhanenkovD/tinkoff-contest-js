import { IOrderExecutor, IPositionKeeper } from "@infrastructure/types";
import { Candle } from "@shared-kernel/candle";
import IStrategy from "./IStrategy";

export default class  implements IStrategy {
  positionsKeeper: IPositionKeeper;
  orderExecutor: IOrderExecutor;

  constructor(positionsKeeper: IPositionKeeper, orderExecutor: IOrderExecutor) {
    this.positionsKeeper = positionsKeeper;
    this.orderExecutor = orderExecutor;
  }
  consume(candle: Candle): void {
    throw new Error("Method not implemented.");
  }
}