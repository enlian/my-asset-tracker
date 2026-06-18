"use client";
import AddAmountModal from "@/components/add-amount-modal";
import Error from "@/components/error";
import HeaderInfo from "@/components/header-info";
import LoginModal from "@/components/login-modal";
import Spinner from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import "chart.js/auto";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import type { AllData } from "./lib/types";

const Charts = dynamic(() => import("@/components/charts"), { ssr: false });

const fetchAssets = async () => {
  const response = await fetch("/api/assets", {
    method: "POST",
  });
  return response.json();
};

const Page = () => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" && !!session;

  const { data, error, isLoading, refetch } = useQuery<AllData>({
    queryKey: ["assets", session?.user?.name],
    queryFn: fetchAssets,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    enabled: isAuthenticated,
  });

  if (status === "loading" || isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col justify-center px-4 py-8 text-center sm:px-6">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/40">
          <h1 className="text-2xl font-semibold text-white">资产管家</h1>
          <p className="mt-3 text-slate-400">
            请先登录以查看您的资产趋势和分析结果。
          </p>
          <div className="mt-6">
            <LoginModal />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.assets?.length) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6">
        <Error
          errorMessage={error?.message || "暂无数据，请重试"}
          fetchData={refetch}
        />
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 px-0 py-4 sm:px-2 md:px-0">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-slate-800 bg-slate-900/95 p-4 shadow-xl shadow-slate-950/30">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
            资产管家
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            移动优先资产追踪
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <AddAmountModal onSuccess={refetch} rate={data.exchangeRate} />
          <LoginModal />
        </div>
      </header>

      <section className="grid gap-4">
        <HeaderInfo data={data} rate={data.exchangeRate} />
        <Charts data={data} />
      </section>
    </main>
  );
};

export default Page;
