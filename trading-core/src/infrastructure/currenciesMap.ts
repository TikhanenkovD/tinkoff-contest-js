import { Currencies } from "@data/currencies";

const byFigiMap: Record<string, Currencies> = {
  'BBG0013HGFT4': Currencies.EUR,
  'BBG0013HJJ31': Currencies.USD,
};

const mapProxy = new Proxy(byFigiMap, {
  get: (target, key: string) => {
    if (key in target) {
      return target[key];
    }
    return Currencies.UNKNOWN;
  }
});

export default mapProxy;