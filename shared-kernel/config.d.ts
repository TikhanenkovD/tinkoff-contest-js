export declare type SystemConfig = {
  accountId: string;
  sandbox: {
    ordersPollingFrequencyMs: number,
  };
  real: {
    ordersPollingFrequencyMs: number,
  };
};

export declare type TradeConfig<T> = {
  instrumentFigi: string;
  tariffCommissionPercentage: number;
  lotSize: number;
  strategies: T;
  currency: string;
};

export declare type CollectConfig = {
  instrumentFigi: string;
  interval: '1m' | '5m' | '15m' | '1h' | '1d';
};

// TODO: Add docs
export declare type FileConfig<T> = {
  system: SystemConfig;
  trade: Array<TradeConfig<T>>;
  collect: Array<CollectConfig>;
}
