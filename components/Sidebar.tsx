"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };
type Group = { label: string; accent?: "sage" | "coral" | "gold"; items: Item[] };

const ACCENT: Record<string, string> = {
  sage: "#6E8B7E",
  coral: "#D96C5F",
  gold: "#D8A63A"
};

const groups: Group[] = [
  { label: "概览", items: [{ href: "/", label: "仪表盘" }] },
  {
    label: "① 学习库",
    accent: "sage",
    items: [
      { href: "/add-material", label: "添加材料" },
      { href: "/candidates", label: "待审" },
      { href: "/library", label: "学习库" }
    ]
  },
  {
    label: "② 今日学习",
    accent: "coral",
    items: [{ href: "/session", label: "今日训练" }]
  },
  {
    label: "③ 反馈与记录",
    accent: "gold",
    items: [
      { href: "/transcript", label: "录入反馈" },
      { href: "/assessment", label: "学习报告" }
    ]
  },
  { label: "设置", items: [{ href: "/settings", label: "AI 设置" }] }
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 h-screen w-60 shrink-0 overflow-y-auto border-r border-[#dfe5e7] bg-white px-4 py-6">
      <Link href="/" className="mb-6 block px-2 text-lg font-black text-ink">
        English Coach
      </Link>
      <nav className="grid gap-5">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="mb-1 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wide text-[#8a979c]">
              {g.accent && (
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: ACCENT[g.accent] }}
                />
              )}
              {g.label}
            </div>
            <div className="grid">
              {g.items.map((it) => {
                const active = isActive(it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`rounded-md px-3 py-2 text-sm ${
                      active
                        ? "bg-[#eef2f3] font-semibold text-ink"
                        : "text-[#536267] hover:bg-[#eef2f3]"
                    }`}
                  >
                    {it.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
