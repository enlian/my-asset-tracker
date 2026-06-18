"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Chart as ChartJS,
  ChartData as ChartJSData,
  ChartOptions,
  TooltipItem,
  registerables,
} from "chart.js";
import "chartjs-adapter-moment";
import zoomPlugin from "chartjs-plugin-zoom";
import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import type { AllData } from "../lib/types";
import { CHART_COLORS, getAmounts, transparentize } from "../lib/utils";

moment.locale("zh-cn");
ChartJS.register(...registerables, zoomPlugin);

interface ChartProps {
  data: AllData | null;
}

const ZOOM_OPTIONS = [
  { label: "今年", key: "year" },
  { label: "近一年", key: "1y" },
  { label: "近三年", key: "3y" },
  { label: "近五年", key: "5y" },
  { label: "全部", key: "all" },
] as const;

type ZoomKey = (typeof ZOOM_OPTIONS)[number]["key"];

const buildZoomRange = (key: ZoomKey) => {
  if (key === "all") return null;

  if (key === "year") {
    return {
      min: moment().startOf("year").valueOf(),
      max: moment().endOf("year").valueOf(),
    };
  }

  const years = Number(key[0]);
  return {
    min: moment().subtract(years, "year").startOf("day").valueOf(),
    max: moment().endOf("day").valueOf(),
  };
};

export default function Charts({ data }: ChartProps) {
  const [activeZoom, setActiveZoom] = useState<ZoomKey>("1y");
  const lineChartRef = useRef<ChartJS<"line"> | null>(null);

  const sortedAssets = useMemo(
    () =>
      data?.assets
        .slice()
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ) ?? [],
    [data],
  );

  const chartData = useMemo<ChartJSData<"line">>(() => {
    const labels = sortedAssets.map((item) => item.date);
    const amounts = getAmounts(sortedAssets, "amount");

    return {
      labels,
      datasets: [
        {
          label: "资产金额",
          data: amounts,
          borderColor: CHART_COLORS.blue,
          backgroundColor: transparentize(CHART_COLORS.blue, 0.16),
          fill: true,
          spanGaps: true,
          cubicInterpolationMode: "monotone",
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [sortedAssets]);

  const assetsChartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          padding: 12,
          callbacks: {
            label: (tooltipItem: TooltipItem<"line">) => {
              const value = tooltipItem.raw as number;
              return `${tooltipItem.dataset.label}: ${(value / 10000).toFixed(2)}万`;
            },
          },
        },
        legend: {
          display: false,
        },
        zoom: {
          pan: {
            enabled: true,
            mode: "x",
          },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x",
          },
          limits: {
            x: { min: "original", max: "original" },
          },
        },
      },
      scales: {
        x: {
          type: "time",
          time: {
            unit: "month",
            displayFormats: {
              month: "MM/DD",
            },
            tooltipFormat: "YYYY/MM/DD",
          },
          ticks: {
            color: "rgba(203, 213, 225, 0.9)",
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
          grid: {
            color: "rgba(148, 163, 184, 0.1)",
          },
        },
        y: {
          ticks: {
            callback: (value: string | number) =>
              typeof value === "number" ? `${value / 10000}万` : value,
            color: "rgba(203, 213, 225, 0.9)",
          },
          grid: {
            color: "rgba(148, 163, 184, 0.08)",
          },
        },
      },
    }),
    [],
  );

  const applyZoom = useCallback((key: ZoomKey) => {
    const chart = lineChartRef.current;
    if (!chart) return;

    if (key === "all") {
      chart.resetZoom();
      return;
    }

    const range = buildZoomRange(key);
    if (range) {
      chart.zoomScale("x", range);
    }
  }, []);

  useEffect(() => {
    if (sortedAssets.length === 0) return;
    applyZoom(activeZoom);
  }, [activeZoom, applyZoom, sortedAssets.length]);

  const handleZoomClick = useCallback(
    (key: ZoomKey) => {
      setActiveZoom(key);
      applyZoom(key);
    },
    [applyZoom],
  );

  const isEmpty = sortedAssets.length === 0;

  return (
    <section className="card overflow-hidden p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">
            资产趋势
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            总资产走势图
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ZOOM_OPTIONS.map(({ label, key }) => (
            <Button
              key={key}
              size="sm"
              variant={activeZoom === key ? "secondary" : "outline"}
              onClick={() => handleZoomClick(key)}
              className="min-w-[68px]"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-4 min-h-[300px] rounded-[2rem] bg-slate-950/70 p-3">
        {isEmpty ? (
          <Skeleton className="h-full min-h-[280px] rounded-[1.5rem]" />
        ) : (
          <div className="h-[320px] sm:h-[380px]">
            <Line
              ref={lineChartRef}
              data={chartData}
              options={assetsChartOptions}
            />
          </div>
        )}
      </div>
    </section>
  );
}
