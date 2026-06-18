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
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

const LoginModal = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });
      if (result?.error) {
        throw new Error(result.error);
      }
      setIsOpen(false);
      toast.success("登录成功");
    },
    onError: (error: any) => {
      toast.error(error.message || "登录失败，请重试");
    },
  });

  const handleLogout = async () => {
    await signOut();
    toast.success("已退出登录");
  };

  return (
    <>
      {!session ? (
        <Button onClick={() => setIsOpen(true)}>登录</Button>
      ) : (
        <Button variant="secondary" onClick={handleLogout}>
          退出
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-sm rounded-[2rem] bg-slate-950 p-6 border border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">
              登录
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate();
            }}
            className="mt-6 space-y-4"
          >
            <label className="block text-sm font-medium text-slate-300">
              用户名
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
                placeholder="请输入用户名"
              />
            </label>

            <label className="block text-sm font-medium text-slate-300">
              密码
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-white"
                placeholder="请输入密码"
              />
            </label>

            {loginMutation.isError && (
              <p className="text-sm text-red-400">
                {loginMutation.error?.message}
              </p>
            )}

            <DialogFooter>
              <Button
                className="w-full"
                type="submit"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "登录中..." : "登录"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginModal;
