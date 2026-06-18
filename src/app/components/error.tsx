import { Button } from "@/components/ui/button";

interface ErrorProps {
  errorMessage: string;
  fetchData: () => void;
}

export default function Error({ errorMessage, fetchData }: ErrorProps) {
  return (
    <div className="mx-auto flex min-h-[320px] max-w-md flex-col items-center justify-center gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-400/10">
      <p className="text-lg font-semibold text-slate-950">加载失败</p>
      <p className="text-sm text-slate-600">
        {errorMessage || "请稍后刷新页面或重新尝试。"}
      </p>
      <Button onClick={fetchData} className="w-full sm:w-auto">
        重试
      </Button>
    </div>
  );
}
