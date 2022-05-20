import MarketCollector from "@application/marketCollector";
import "dotenv/config";
import { createSdk } from "invest-nodejs-grpc-sdk";
import * as config from "../.././config.json";

const start = async () => {
  const isSandbox = true;
  const isBacktest = false;
  //@ts-ignore
  const tinkoffClient = createSdk(process.env.TINK_TOKEN, "TikhanenkovD");
  const marketCollector = new MarketCollector(
    isBacktest,
    isSandbox,
    tinkoffClient,
    config.collect
  );
  await marketCollector.start();
};

start();
