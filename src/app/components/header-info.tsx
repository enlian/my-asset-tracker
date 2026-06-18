import moment from "moment";
import React, { useMemo } from "react";
import type { AllData } from "../lib/types";
import { getAmounts, getAnnualizedReturnRate } from "../lib/utils";

interface Props {
  data: AllData | null;
  rate: { usd: number; gbp: number };
}

const HeaderInfo = React.memo(({ data, rate }: Props) => {
  const stats = useMemo(() => {
    const assets = data?.assets ?? [];
    const amounts = getAmounts(assets, "amount");
    const latestAmount = amounts.at(-1) ?? 0;
    const maxAmount = amounts.length ? Math.max(...amounts) : 0;
    const drawdown = maxAmount
      ? ((latestAmount - maxAmount) / maxAmount) * 100
      : 0;
    const latestDate = assets.length
      ? moment(assets.at(-1)?.date).format("YYYY/MM/DD")
      : "--";

    return {
      latestAmount,
      maxAmount,
      drawdown,
      latestDate,
      usdRate: rate.usd,
      gbpRate: rate.gbp,
    };
  }, [data?.assets, rate]);

  const annualized = getAnnualizedReturnRate(data?.assets || []);
  const latestWan = (stats.latestAmount / 10000).toFixed(2);
  const maxWan = (stats.maxAmount / 10000).toFixed(2);
  const drawdownLabel =
    stats.drawdown <= 0
      ? `${Math.abs(stats.drawdown).toFixed(2)}%`
      : `+${stats.drawdown.toFixed(2)}%`;

  return (
    <section className="grid gap-4">
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-400/10">
        <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              最新更新
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {stats.latestDate}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700">
            移动优先体验
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              当前资产
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {latestWan}万
            </p>
            <p className="mt-2 text-sm text-slate-500">
              美元约 {(stats.latestAmount / stats.usdRate / 10000).toFixed(2)}万
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              历史高点
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {maxWan}万
            </p>
            <p className="mt-2 text-sm text-slate-500">回撤 {drawdownLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            年化收益
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {annualized}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            美元汇率
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {stats.usdRate.toFixed(2)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            英镑汇率
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">
            {stats.gbpRate.toFixed(2)}
          </p>
        </div>
      </div>
    </section>
  );
});

HeaderInfo.displayName = "HeaderInfo";

export default HeaderInfo;
