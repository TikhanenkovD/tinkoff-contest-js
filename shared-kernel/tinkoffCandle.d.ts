export declare type TinkoffCandle = {
  open: {
    units: number;
    nano: number;
  };
  high: {
    units: number;
    nano: number;
  };
  low: {
    units: number;
    nano: number;
  };
  close: {
    units: number;
    nano: number;
  };
  volume: number;
  time: Date;
  figi: string;
  isCompelete: boolean;
};
