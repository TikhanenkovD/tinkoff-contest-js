import { Candle } from '@shared-kernel/candle';
import logger from '@shared-kernel/logger';
import { Queues } from '@shared-kernel/queue';
import QueueClient, { Message } from '@infrastructure/queueClient';
import metricsLogger from '@infrastructure/metricsLogger';
import Metrics from './metrics';


type ConsumeCallback = (candle: Candle) => Promise<void> | void;

export default class CandlesProvider {
  private readonly queue: QueueClient;

  private readonly watchingFigi: string[] = [];

  constructor(isSandbox: boolean, figiToWatch: string[]) {
    if (!figiToWatch|| !Array.isArray(figiToWatch) || figiToWatch.length === 0) {
      throw new TypeError('figiToWatch is not valid');
    }

    this.watchingFigi = figiToWatch;
    this.queue = new QueueClient(isSandbox ? Queues.CANDLES_SANDBOX : Queues.CANDLES);

    this.filterInteresting = this.filterInteresting.bind(this);
  }

  public async start(callback: ConsumeCallback): Promise<void> {
    try {
      if (!this.queue.IsConnected) {
        await this.queue.connect();
      }

      this.queue.subscribe((message) => this.filterInteresting(message, callback));
    } catch (e) {
      logger.error('Failure while starting to watch for candles', e);
    }
  }

  private async filterInteresting(message: Message, callback: ConsumeCallback) {
    try {
      const candle = JSON.parse(message.content.toString()) as Candle;
      if (!candle.Figi) {
        metricsLogger.track(Metrics.candles.invalidCandleReceived);
        logger.warn('Candle has no Figi');
        return;
        // throw new TypeError('Candle has no Figi');
      }
      metricsLogger.track(Metrics.candles.received);

      if (this.watchingFigi.includes(candle.Figi)) {
        await callback(candle);
      } else {
        // logger.warn(`Got queue message containing not interesting Figi: ${candle.Figi}`);
      }
    } catch (e) {
      logger.error(`Failed to process queue message: ${message}`, e);
    }
  }
}