import "dotenv/config";
import { createSdk } from "invest-nodejs-grpc-sdk";

import ConfigProvider from "@application/configProvider";
import ServicesFactory from "@infrastructure/implementations/servicesFactory";
import { CandlesPool } from "@application/candlesPool";
import StrategiesFactory from "@application/strategies/strategiesFactory";
import CandlesProvider from "@application/candlesProvider";

const start = async () => {
  const config = ConfigProvider.get();

  const tinkoffSdk = createSdk(process.env.TINK_TOKEN);

  const isSandbox = true;

  const servicesConstructors = new ServicesFactory(tinkoffSdk).assemble(
    isSandbox
  );

  const factory = new StrategiesFactory();
  const strategies = await factory.assemble(
    config.system,
    config.trade,
    servicesConstructors
  );

  const pool = new CandlesPool(strategies);

  const figiList = config.trade.map((item) => item.instrumentFigi);
  const candlesProvider = new CandlesProvider(isSandbox, figiList);
  await candlesProvider.start(pool.consume);
};

start();
