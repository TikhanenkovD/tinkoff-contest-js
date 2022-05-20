type Order = {
  type: "buy" | "sell",
  figi: string,
  lots: number,
  dealPrice: number,
};

export default Order;