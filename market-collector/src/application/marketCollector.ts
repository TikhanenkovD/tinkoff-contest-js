import ServicesFactory from "../infrastructure/servicesFactory";

import QueueService from "@infrastructure/queueService";
import { Queues } from "@shared-kernel/queue";
import { CollectConfig } from "@shared-kernel/config";

export default class MarketCollector {
  servicesConstructor: any;
  queueService: any;
  candlesService: any;
  services: any;
  isBacktest: boolean;
  isSandbox: boolean;
  sdk: any;
  queueName: Queues = Queues.CANDLES;
  config: CollectConfig;

  constructor(isBacktest, isSandbox, sdk, config) {
    if (!sdk) throw new Error("sdk is required");
    this.sdk = sdk;
    this.config = config;
    this.isBacktest = isBacktest;
    this.isSandbox = isSandbox;
  }

  async start() {
    this.servicesConstructor = new ServicesFactory(this.sdk, this.config);
    this.services = this.servicesConstructor.assemble(
      this.isSandbox,
      this.isBacktest
    );
    await this.initQueueService();
    this.initCandlesService();

    await this.assemble();
  }

  async initQueueService() {
    this.queueService = new QueueService(
      this.isSandbox ? Queues.CANDLES_SANDBOX : Queues.CANDLES
    );
    await this.queueService.init();
  }

  initCandlesService() {
    this.candlesService = this.services.CandlesService();
  }

  async assemble() {
    this.isBacktest
      ? this.startBacktestCollector()
      : this.isSandbox
      ? await this.startSandboxCollector()
      : this.startRealCollector();
  }

  startBacktestCollector() {}

  async startSandboxCollector() {
    console.log("Collector sandbox started");
    setInterval(async () => {
      const candle = await this.candlesService.getCandles();
      if (!candle) return;
      await this.queueService.send(candle);
    }, 10000);
  }

  async startRealCollector() {
    console.log("Collector candles stream started");
    const candle = await this.candlesService.getCandles();
  }
}
