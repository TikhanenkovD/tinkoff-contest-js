const maxNano = 1_000_000_000;
export const qToNum = (q: { units: number, nano: number }) => q.units + (q.nano / maxNano);

export const numberToQ = (num: number) => ({
  units: Math.floor(num),
  nano: Math.trunc(num),
})