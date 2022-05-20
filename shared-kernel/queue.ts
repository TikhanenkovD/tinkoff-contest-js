export type QueueMsgBase = {
  type: string;
  content: unknown;
  date?: Date;
};

export enum Queues {
  CANDLES_SANDBOX = "CANDLES_SANDBOX",
  CANDLES = "CANDLES",
}
