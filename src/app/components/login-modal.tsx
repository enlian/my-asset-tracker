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
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const LoginModal = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname(); // 获取当前路径

  // 处理登录
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
      toast.error(error.message || "发生未知错误，请稍后重试");
    },
  });

  // 处理登出
  const handleLogout = async () => {
    await signOut();
    toast.success("已退出登录");
  };

  return (
    <>
      {!session ? (
        <Button onClick={() => setIsOpen(true)}>登录</Button>
      ) : (
        <div className="flex gap-3">
          {/* {pathname !== "/history" && (
            <Button onClick={() => router.push("/history")}>历史</Button>
          )} */}
          <Button className="bg-gray-700" onClick={handleLogout}>
            退出
          </Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[300px] bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>登录</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate();
            }}
            className="space-y-4 mt-3"
          >
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-2 text-white"
              >
                用户名
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md bg-gray-700 text-white"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 text-white"
              >
                密码
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md bg-gray-700 text-white"
              />
            </div>
            {loginMutation.isError && (
              <p className="text-red-500 text-sm">
                {loginMutation.error?.message}
              </p>
            )}
            <DialogFooter>
              <Button
                className="w-full p-5 mt-3"
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
