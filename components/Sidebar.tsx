"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };
type Group = {
  label: string;
  accent?: "sage" | "coral" | "gold";
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
    items: [
      { href: "/add-material", label: "添加材料" },
      { href: "/candidates", label: "待审" },
      { href: "/library", label: "学习库" }
    ]
  },
  {
    label: "今日学习",
    accent: "coral",
    items: [{ href: "/session", label: "今日训练" }]
  },
  {
    label: "反馈与记录",
    accent: "gold",
    items: [
      { href: "/transcript", label: "录入反馈" },
      { href: "/assessment", label: "学习报告" }
    ]
  }
];

const settingsGroup: Group = {
  label: "设置",
  items: [{ href: "/settings", label: "AI 设置" }]
};

function GroupBlock({ g }: { g: Group }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const accent = ACCENT[g.accent ?? "neutral"];
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 px-2">
        <span className="h-4 w-1 rounded-full" style={{ background: accent.solid }} />
        <span className="text-[15px] font-semibold text-ink">{g.label}</span>
      </div>
      <div className="grid gap-0">
        {g.items.map((it) => {
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`rounded-lg px-3 py-1 text-[14px] transition-colors ${
                active
                  ? "font-semibold text-ink"
                  : "text-[#536267] hover:bg-[#eef2f3]"
              }`}
              style={active ? { background: accent.tint } : undefined}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-[#e4e9ea] bg-[#fbfcfc] px-5 py-7">
      <Link href="/" className="mb-9 flex items-center gap-2.5 px-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-black text-white">
          E
        </span>
        <span className="text-lg font-black tracking-tight text-ink">
          English Coach
        </span>
      </Link>

      <nav className="grid gap-12">
        {groups.map((g) => (
          <GroupBlock key={g.label} g={g} />
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <div className="border-t border-[#e4e9ea] pt-4">
          <GroupBlock g={settingsGroup} />
        </div>
        <p className="mt-4 px-2 text-[11px] leading-relaxed text-[#9aa6ab]">
          学习闭环：材料 → 学习库 → 今日训练 → 反馈 → 回流
        </p>
      </div>
    </aside>
  );
}
