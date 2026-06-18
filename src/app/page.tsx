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

  if (status === "loading") {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-4 p-6 dark:bg-gray-900 dark:text-white min-h-screen">
        <div className="flex justify-end gap-3">
          <LoginModal />
        </div>
        <div className="flex-1 flex items-center justify-center text-white text-lg">
          请先登录以查看资产数据。
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !data?.assets?.length) {
    return (
      <Error
        errorMessage={error?.message || "暂无数据，请重试"}
        fetchData={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 dark:bg-gray-900 dark:text-white min-h-screen">
      <div className="flex justify-end gap-3">
        <AddAmountModal onSuccess={refetch} rate={data.exchangeRate} />
        <LoginModal />
      </div>

      <HeaderInfo data={data} rate={data.exchangeRate} />
      <Charts data={data} />
    </div>
  );
};

export default Page;
