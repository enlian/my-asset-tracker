"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Chart as ChartJS, registerables, TooltipItem } from "chart.js";
import "chartjs-adapter-moment";
import zoomPlugin from "chartjs-plugin-zoom";
import moment from "moment";
// import "moment/locale/zh-cn";

import { useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import type { AllData, ChartData } from "../lib/types";
import { CHART_COLORS, getAmounts, transparentize } from "../lib/utils";

moment.locale("zh-cn");
ChartJS.register(...registerables, zoomPlugin);

interface ChartProps {
  data: AllData | null;
}

// 缩放按钮配置
const ZOOM_OPTIONS = [
  { label: "今年", key: "year" },
  { label: "近一年", key: "1y" },
  { label: "近三年", key: "3y" },
  { label: "近五年", key: "5y" },
  { label: "全部", key: "all" },
] as const;

type ZoomKey = (typeof ZOOM_OPTIONS)[number]["key"];

export default function Charts({ data }: ChartProps) {
  const [assetsChartData, setAssetsChartData] = useState<ChartData | null>(
    null,
  );

  const [assetsChartLoading, setAssetsChartLoading] = useState(false);

  const [activeZoom, setActiveZoom] = useState<ZoomKey>("1y");
  const lineChartRef = useRef<ChartJS<"line"> | null>(null);

  const labels = useMemo(() => {
    return data?.assets.map((item: { date: string }) => item.date) ?? [];
  }, [data]);

  const amounts = useMemo(() => {
    return data ? getAmounts(data.assets, "amount") : [];
  }, [data]);

  useEffect(() => {
    if (!data) return;
  }, [data]);

  useEffect(() => {
    if (!data) return;

    setAssetsChartData({
      labels,
      datasets: [
        {
          label: "资产金额 (元)",
          data: amounts,
          borderColor: transparentize(CHART_COLORS.blue, 0),
          backgroundColor: transparentize(CHART_COLORS.blue, 0.3),
          fill: true,
          spanGaps: true,
          cubicInterpolationMode: "monotone",
          tension: 1,
        },
      ],
    });
  }, [labels, amounts]);

  useEffect(() => {
    zoomHandler(activeZoom);
  }, [assetsChartData]);

  // 处理缩放按钮点击事件
  const zoomHandler = (key: ZoomKey) => {
    const chart = lineChartRef.current;
    if (!chart) return;
    setActiveZoom(key);
    let count = 0;
    const intervalId = setInterval(() => {
      zoomTo(key);
      count++;
      if (count >= 3) {
        clearInterval(intervalId);
      }
    }, 500);
  };

  // 通用缩放函数
  const zoomTo = (key: ZoomKey) => {
    const chart = lineChartRef.current;
    if (!chart) return;
    chart.update();

    if (key === "year") {
      const start = moment().startOf("year");
      const end = moment().endOf("year");
      chart.zoomScale("x", { min: start.valueOf(), max: end.valueOf() });
    } else if (["1y", "3y", "5y"].includes(key)) {
      const years = parseInt(key[0]);
      const start = moment().subtract(years, "year").startOf("day");
      const end = moment().endOf("day");
      chart.zoomScale("x", { min: start.valueOf(), max: end.valueOf() });
    } else if (key === "all") {
      chart.resetZoom();
    }
  };

  const assetsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: "总资产走势图",
        color: "white",
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: function (tooltipItem: TooltipItem<"line">) {
            const value = tooltipItem.raw as number;
            return `${tooltipItem.dataset.label}: ${(value / 10000).toFixed(
              2,
            )}万`;
          },
        },
      },
      legend: {
        labels: {
          color: "white",
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x" as const,
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: "x" as const,
        },
        limits: {
          x: { min: "original" as const, max: "original" as const },
        },
      },
    },
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "month" as const,
          displayFormats: {
            month: "YY/M/D",
          },
          tooltipFormat: "YYYY/MM/DD",
        },
        ticks: {
          maxTicksLimit: 30,
          color: "white", // x轴文字颜色
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)", // x轴网格线颜色
        },
      },
      y: {
        ticks: {
          callback: (value: string | number) =>
            typeof value === "number" ? value / 10000 + "万" : value,
          color: "white", // y轴文字颜色
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)", // y轴网格线颜色
        },
      },
    },
  };

  return (
    <>
      <div className="h-[350px] mb-5 relative">
        {/* {assetsChartData && assetsChartData.datasets[0].data.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            暂无数据
          </div>
        )} */}
        <div className="flex flex-wrap justify-end gap-2 sm:absolute sm:right-0 sm:top-5">
          {ZOOM_OPTIONS.map(({ label, key }) => (
            <Button
              key={key}
              onClick={zoomHandler.bind(null, key)}
              variant={activeZoom === key ? "secondary" : "default"}
            >
              {label}
            </Button>
          ))}
        </div>
        {assetsChartLoading ? (
          <Skeleton className="h-[300]" />
        ) : (
          assetsChartData && (
            <Line
              ref={lineChartRef}
              data={assetsChartData}
              options={assetsChartOptions}
            />
          )
        )}
      </div>
    </>
  );
}
