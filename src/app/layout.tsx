import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "./providers/QueryProvider";
import SessionProvider from "./providers/SessionProvider";

export const metadata = {
  title: "资产管家",
  description: "移动优先资产追踪与可视化分析",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto min-h-screen w-full max-w-5xl px-4 py-4 md:px-6 md:py-6">
          <QueryProvider>
            <SessionProvider>{children}</SessionProvider>
          </QueryProvider>
          <Toaster richColors position="top-center" />
        </div>
      </body>
    </html>
  );
}
