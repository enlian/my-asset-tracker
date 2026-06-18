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
    const drawdown = maxAmount ? ((latestAmount - maxAmount) / maxAmount) * 100 : 0;
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
  const drawdownLabel = stats.drawdown <= 0 ? `${Math.abs(stats.drawdown).toFixed(2)}%` : `+${stats.drawdown.toFixed(2)}%`;

  return (
    <section className="grid gap-4">
      <div className="card p-5">
        <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-950/90 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">最新更新</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.latestDate}</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-200">
            移动优先体验
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-900/90 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">当前资产</p>
            <p className="mt-3 text-3xl font-semibold text-white">{latestWan}万</p>
            <p className="mt-2 text-sm text-slate-400">美元约 {(stats.latestAmount / stats.usdRate / 10000).toFixed(2)}万</p>
          </div>
          <div className="rounded-3xl bg-slate-900/90 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">历史高点</p>
            <p className="mt-3 text-3xl font-semibold text-white">{maxWan}万</p>
            <p className="mt-2 text-sm text-slate-400">回撤 {drawdownLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">年化收益</p>
          <p className="mt-3 text-2xl font-semibold text-white">{annualized}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">美元汇率</p>
          <p className="mt-3 text-2xl font-semibold text-white">{stats.usdRate.toFixed(2)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">英镑汇率</p>
          <p className="mt-3 text-2xl font-semibold text-white">{stats.gbpRate.toFixed(2)}</p>
        </div>
      </div>
    </section>
  );
});

export default HeaderInfo;
