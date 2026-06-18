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
import { useCallback, useEffect, useRef, useState } from "react";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { RiResetLeftFill } from "react-icons/ri";
import { toast } from "sonner";
import { z } from "zod";

// Schema
const amountSchema = z.array(
  z.object({
    amount: z
      .number()
      .min(1, { message: "金额必须大于0" })
      .max(10000000, { message: "金额不能超过1000万" }),
    currency: z.enum(["CNY", "USD", "GBP"]),
  }),
);

const defaultRows: { amount: number; currency: "CNY" | "USD" | "GBP" }[] = [
  { amount: 0, currency: "CNY" },
  { amount: 0, currency: "CNY" },
  { amount: 0, currency: "CNY" },
  { amount: 0, currency: "CNY" },
  { amount: 0, currency: "USD" },
  { amount: 0, currency: "USD" },
  { amount: 0, currency: "GBP" },
];

const AddAmountModal = ({
  onSuccess,
  rate,
}: {
  onSuccess: () => void;
  rate: { usd: number; gbp: number };
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const [rows, setRows] = useState(defaultRows);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, rows.length);
  }, [rows]);

  const updateRow = useCallback(
    (index: number, key: keyof (typeof defaultRows)[0], value: any) => {
      setRows((prevRows) => {
        const updated = [...prevRows];
        updated[index] = {
          ...updated[index],
          [key]:
            key === "amount"
              ? value && !isNaN(parseInt(value))
                ? parseInt(value)
                : 0
              : value,
        };
        return updated;
      });
    },
    [],
  );

  const handleAmountChange = (index: number, value: string) =>
    updateRow(index, "amount", value);
  const handleCurrencyChange = (
    index: number,
    currency: "CNY" | "USD" | "GBP",
  ) => updateRow(index, "currency", currency);

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prevRows) => prevRows.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    setRows((prevRows) => [...prevRows, { amount: 0, currency: "CNY" }]);
  };

  const getTotalInCNY = () => {
    return rows.reduce((sum, row) => {
      const currentRate =
        row.currency === "USD"
          ? rate.usd
          : row.currency === "GBP"
            ? rate.gbp
            : 1;
      return sum + row.amount * currentRate;
    }, 0);
  };

  const addAmount = async ({ total }: { total: number }) => {
    const res = await fetch("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total.toFixed(0) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  };

  const addMutation = useMutation({
    mutationFn: (total: number) => addAmount({ total }),
    onSuccess: (data) => {
      setIsOpen(false);
      toast.success(data.message || "金额已成功插入");
      onSuccess();
      setIsSubmitting(false);
      setRows(defaultRows);
    },
    onError: (error: any) => {
      setIsSubmitting(false);
      toast.error(error.message || "插入失败，请重试");
    },
  });

  const handleSubmit = () => {
    const validation = amountSchema.safeParse(rows);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    const totalInCNY = getTotalInCNY();
    if (totalInCNY === 0 || isNaN(totalInCNY)) {
      toast.error("请输入有效的金额");
      return;
    }

    if (!session) {
      toast.error("用户未登录");
      return;
    }

    setIsSubmitting(true);
    addMutation.mutate(totalInCNY);
  };

  return (
    <>
      {session && (
        <Button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center p-2"
        >
          <IoMdAdd size={20} />
        </Button>
      )}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[500] bg-gray-800 p-6 rounded-md border border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">添加数据</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-3">
            <div className="flex flex-col gap-6 w-full">
              <div className="flex flex-col gap-4 items-center">
                {rows.map((row, index) => (
                  <div key={index} className="flex gap-3 items-center w-full">
                    <input
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      className="text-lg w-32 p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={row.amount}
                      onChange={(e) =>
                        handleAmountChange(index, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "+" || e.key === "Enter") {
                          e.preventDefault();
                          if (index < rows.length - 1) {
                            inputRefs.current[index + 1]?.focus();
                          } else {
                            handleAddRow();
                            setTimeout(() => {
                              inputRefs.current[index + 1]?.focus();
                            }, 0);
                          }
                        }

                        // Backspace 删除行逻辑（如果金额为空或为0）
                        if (
                          e.key === "Backspace" &&
                          String(rows[index].amount) === "0"
                        ) {
                          e.preventDefault();
                          if (rows.length > 1) {
                            handleRemoveRow(index);
                            setTimeout(() => {
                              const newIndex = index === 0 ? 0 : index - 1;
                              inputRefs.current[newIndex]?.focus();
                            }, 0);
                          }
                        }
                      }}
                      placeholder="金额"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCurrencyChange(index, "CNY")}
                        className={`px-3 py-1 rounded border ${
                          row.currency === "CNY"
                            ? "bg-green-900 border-green-700"
                            : "bg-gray-800 border-gray-600"
                        }`}
                      >
                        CNY
                      </button>
                      <button
                        onClick={() => handleCurrencyChange(index, "USD")}
                        className={`px-3 py-1 rounded border ${
                          row.currency === "USD"
                            ? "bg-yellow-800 border-yellow-600"
                            : "bg-gray-800 border-gray-600"
                        }`}
                      >
                        USD
                      </button>
                      <button
                        onClick={() => handleCurrencyChange(index, "GBP")}
                        className={`px-3 py-1 rounded border ${
                          row.currency === "GBP"
                            ? "bg-purple-900 border-purple-600"
                            : "bg-gray-800 border-gray-600"
                        }`}
                      >
                        GBP
                      </button>
                    </div>
                    <IoMdClose
                      size={24}
                      className="cursor-pointer text-red-500 hover:text-red-700 ml-2"
                      onClick={() => handleRemoveRow(index)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="white">
                  合计(CNY) <span className="ml-1">￥</span>
                  <span className="text-xl">{getTotalInCNY().toFixed(0)}</span>
                </span>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setRows(defaultRows)}
                    className="flex items-center justify-center p-2 bg-red-900 hover:bg-red-700 rounded-full"
                  >
                    <RiResetLeftFill size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center justify-center p-2 bg-blue-600 hover:bg-blue-700 rounded-full"
                  >
                    <IoMdAdd size={20} />
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={handleSubmit}
                className={`w-full p-6 text-white text-xl rounded-md ${
                  isSubmitting || addMutation.isPending
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={addMutation.isPending || isSubmitting}
              >
                {isSubmitting || addMutation.isPending ? "提交中..." : "提交"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddAmountModal;
