import { Currencies } from "./currencies";

export type Share = {
  figi: string;
  currency: Currencies;
  quantity: number;
  lotSize: number;
  quantityLots: number;

  avgPrice?: number;
  actualPrice?: number;
  blockedLots?: number;
}

export default Share;