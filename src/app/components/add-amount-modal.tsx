"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { IoMdAdd } from "react-icons/io";
import { toast } from "sonner";
import { z } from "zod";

const amountSchema = z.object({
  amount: z.number().min(1, { message: "金额必须大于0" }),
  currency: z.enum(["CNY", "USD", "GBP"]),
});

const defaultRows = [
  { amount: 0, currency: "CNY" as const },
  { amount: 0, currency: "USD" as const },
  { amount: 0, currency: "GBP" as const },
];

type Currency = "CNY" | "USD" | "GBP";

type Row = {
  amount: number;
  currency: Currency;
};

const AddAmountModal = ({
  onSuccess,
  rate,
}: {
  onSuccess: () => void;
  rate: { usd: number; gbp: number };
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const [rows, setRows] = useState<Row[]>(defaultRows);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validRows = useMemo(() => rows.filter((row) => row.amount > 0), [rows]);

  const totalInCNY = useMemo(
    () =>
      validRows.reduce((sum, row) => {
        const currentRate =
          row.currency === "USD"
            ? rate.usd
            : row.currency === "GBP"
              ? rate.gbp
              : 1;
        return sum + row.amount * currentRate;
      }, 0),
    [validRows, rate],
  );

  const updateRow = (index: number, partial: Partial<Row>) => {
    setRows((prevRows) =>
      prevRows.map((row, i) => (i === index ? { ...row, ...partial } : row)),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, { amount: 0, currency: "CNY" }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addAmount = async (amount: number) => {
    const res = await fetch("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount.toFixed(0) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "提交失败");
    return data;
  };

  const addMutation = useMutation({
    mutationFn: addAmount,
    onSuccess: (result) => {
      setIsSubmitting(false);
      setIsOpen(false);
      toast.success(result.message || "金额已成功插入");
      onSuccess();
      setRows(defaultRows);
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      toast.error(error.message || "插入失败，请重试");
    },
  });

  const handleSubmit = () => {
    if (validRows.length === 0) {
      toast.error("请先输入有效金额");
      return;
    }

    const validation = z.array(amountSchema).safeParse(validRows);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || "请检查输入");
      return;
    }

    if (!session) {
      toast.error("请先登录");
      return;
    }

    setIsSubmitting(true);
    addMutation.mutate(totalInCNY);
  };

  return (
    <>
      {session ? (
        <Button onClick={() => setIsOpen(true)} size="icon" variant="secondary">
          <IoMdAdd size={20} />
        </Button>
      ) : null}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-md rounded-[2rem] bg-slate-950 p-6 border border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              添加资产
            </DialogTitle>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            {rows.map((row, index) => (
              <div
                key={index}
                className="flex flex-wrap gap-3 rounded-3xl border border-slate-800 bg-slate-900 p-4"
              >
                <input
                  type="number"
                  min={0}
                  value={row.amount}
                  onChange={(e) =>
                    updateRow(index, { amount: Number(e.target.value) })
                  }
                  className="w-full flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
                  placeholder="金额"
                />
                <select
                  value={row.currency}
                  onChange={(e) =>
                    updateRow(index, { currency: e.target.value as Currency })
                  }
                  className="w-24 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
                >
                  <option value="CNY">CNY</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full border border-slate-700 text-slate-300"
                  onClick={() => removeRow(index)}
                >
                  ×
                </Button>
              </div>
            ))}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">合计(CNY)</p>
                <p className="text-2xl font-semibold text-white">
                  ￥{totalInCNY.toFixed(0)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={addRow}>
                  新增行
                </Button>
                <Button variant="outline" onClick={() => setRows(defaultRows)}>
                  重置
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting || addMutation.isPending}
            >
              {isSubmitting || addMutation.isPending ? "提交中..." : "提交"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddAmountModal;
