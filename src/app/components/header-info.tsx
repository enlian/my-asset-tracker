import moment from "moment";
import React, { useMemo } from "react";
import type { AllData } from "../lib/types";
import { getAmounts, getAnnualizedReturnRate } from "../lib/utils";

interface Props {
  data: AllData | null;
  rate: { usd: number; gbp: number };
}

/**
 * @page 最新、高点和当前回撤
 */
const HeaderInfo = React.memo(({ data, rate }: Props) => {
  const { latestAmount, maxAmount, drawdown, latestFormattedDate } =
    useMemo(() => {
      const amounts = data ? getAmounts(data.assets, "amount") : [];

      if (amounts.length === 0) {
        return {
          latestAmount: null,
          maxAmount: null,
          drawdown: null,
          latestFormattedDate: null,
        };
      }

      const latestAmount = amounts.at(-1)!;
      const maxAmount = Math.max(...amounts);
      const drawdown =
        parseFloat(
          (((maxAmount - latestAmount) / maxAmount) * 100).toFixed(2)
        ) + "%";
      const latestFormattedDate = moment(data?.assets?.at(-1)?.date).format(
        "YYYY/MM/DD"
      );

      return { latestAmount, maxAmount, drawdown, latestFormattedDate };
    }, [data?.assets]);

  const annualized = getAnnualizedReturnRate(data?.assets || []);

  const latestWan = latestAmount ? (latestAmount / 10000).toFixed(2) : null;
  const latestUsdWan =
    latestAmount && rate?.usd
      ? (latestAmount / rate.usd / 10000).toFixed(2)
      : null;
  const maxWan = maxAmount ? (maxAmount / 10000).toFixed(2) : null;

  return (
    <div className="p-4 bg-gray-800 shadow-sm rounded-lg">
      <p className="text-gray-300 text-sm">
        {latestFormattedDate} {latestWan && <b>{latestWan}万</b>}{" "}
        {latestUsdWan && ` / ${latestUsdWan}万 (美元${rate.usd})`}{" "}
        {maxWan && ` / 最高 ${maxWan}万`}
        {drawdown != null && parseFloat(drawdown) !== 0 && (
          <b>
            {"("}-{drawdown}
            {")"}
          </b>
        )}
        /年化
        <b>{annualized}</b>
      </p>
    </div>
  );
});

export default HeaderInfo;
