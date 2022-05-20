export enum MarketQueueMsgs {
  Candle
}

export type CandleMsg = Queue.QueueMsgBase & {
  type: MarketQueueMsgs.Candle;
  content: Base.Candle;
}