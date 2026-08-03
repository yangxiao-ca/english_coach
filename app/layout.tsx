import Link from "next/link";
import "./globals.css";

const nav = [
  ["/input-material", "输入材料"],
  ["/generate-material", "生成材料"],
  ["/candidates", "候选项"],
  ["/library", "学习库"],
  ["/session", "今日训练"],
  ["/transcript", "转写评估"],
  ["/assessment", "评估报告"],
  ["/settings", "AI 设置"]
];

export const metadata = {
  title: "English Coach MVP",
  description: "Local English speaking learning admin system"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-[#dfe5e7] bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-4">
            <Link href="/" className="text-lg font-black text-ink">
              English Coach
            </Link>
            <nav className="flex flex-wrap gap-2 text-sm">
              {nav.map(([href, label]) => (
                <Link key={href} href={href} className="rounded-md px-3 py-2 font-semibold text-[#536267] hover:bg-mist hover:text-ink">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
