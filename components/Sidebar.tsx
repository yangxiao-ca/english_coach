"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };
type Group = {
  label: string;
  accent?: "sage" | "coral" | "gold";
  step?: string;
  items: Item[];
};

const ACCENT: Record<string, { solid: string; tint: string }> = {
  sage: { solid: "#6E8B7E", tint: "#eaf0ed" },
  coral: { solid: "#D96C5F", tint: "#fbecea" },
  gold: { solid: "#D8A63A", tint: "#faf3e3" },
  neutral: { solid: "#9aa6ab", tint: "#eef2f3" }
};

const groups: Group[] = [
  { label: "概览", items: [{ href: "/", label: "仪表盘" }] },
  {
    label: "学习库",
    accent: "sage",
    step: "01",
    items: [
      { href: "/add-material", label: "添加材料" },
      { href: "/candidates", label: "待审" },
      { href: "/library", label: "学习库" }
    ]
  },
  {
    label: "今日学习",
    accent: "coral",
    step: "02",
    items: [{ href: "/session", label: "今日训练" }]
  },
  {
    label: "反馈与记录",
    accent: "gold",
    step: "03",
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
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-[#e4e9ea] bg-[#fbfcfc] px-5 py-7">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-black text-white">
          E
        </span>
        <span className="text-lg font-black tracking-tight text-ink">
          English Coach
        </span>
      </Link>

      <nav className="grid gap-6">
        {groups.map((g) => {
          const accent = ACCENT[g.accent ?? "neutral"];
          return (
            <div key={g.label}>
              <div className="mb-2 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-1 rounded-full"
                    style={{ background: accent.solid }}
                  />
                  <span className="text-[15px] font-semibold text-ink">
                    {g.label}
                  </span>
                </div>
                {g.step && (
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[11px] font-bold tracking-wider"
                    style={{ background: accent.tint, color: accent.solid }}
                  >
                    STEP {g.step}
                  </span>
                )}
              </div>

              <div className="grid gap-0.5">
                {g.items.map((it) => {
                  const active = isActive(it.href);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={`rounded-lg px-3 py-2 text-[14px] transition-colors ${
                        active
                          ? "font-semibold text-ink"
                          : "text-[#536267] hover:bg-[#eef2f3]"
                      }`}
                      style={
                        active ? { background: accent.tint } : undefined
                      }
                    >
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-6 text-[11px] leading-relaxed text-[#9aa6ab]">
        学习闭环：材料 → 学习库 → 今日训练 → 反馈 → 回流
      </div>
    </aside>
  );
}
