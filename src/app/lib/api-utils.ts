import { getExchangeRate } from "./utils";

export async function getVisitorData() {
  return {
    exchangeRate: await getExchangeRate(),
  };
}
