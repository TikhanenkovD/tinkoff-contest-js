export default function qToNum(q: { units: number; nano: number }) {
  const maxNano: number = 1000000000;
  return q.units + q.nano / maxNano;
}
