import Link from "next/link";
import { getDashboardStats } from "../lib/db";

export const dynamic = "force-dynamic";

export default function Home() {
  const s = getDashboardStats();
  return (
    <div className="grid gap-6">
      <section>
        <h1 className="text-3xl font-black">学习概览</h1>
        <p className="mt-2 max-w-3xl text-[#536267]">
          英语口语学习闭环：材料进入学习库 → 生成今日训练 → 练习后反馈回流，更新掌握度与复习调度。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5" style={{ borderTop: "3px solid #6E8B7E" }}>
          <h2 className="text-lg font-black text-[#3f6b5d]">① 学习库</h2>
          <p className="text-sm text-[#536267]">维护与生成</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl font-black">{s.candidates}</div>
              <div className="text-xs text-[#8a979c]">待审</div>
            </div>
            <div>
              <div className="text-2xl font-black">{s.active}</div>
              <div className="text-xs text-[#8a979c]">在库</div>
            </div>
            <div>
              <div className="text-2xl font-black">{s.mastered}</div>
              <div className="text-xs text-[#8a979c]">已掌握</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/add-material" className="link-button btn-primary">
              添加材料
            </Link>
            <Link href="/candidates" className="link-button btn-secondary">
              待审
            </Link>
            <Link href="/library" className="link-button btn-secondary">
              学习库
            </Link>
          </div>
        </div>

        <div className="panel p-5" style={{ borderTop: "3px solid #D96C5F" }}>
          <h2 className="text-lg font-black text-[#a33d33]">② 今日学习</h2>
          <p className="text-sm text-[#536267]">生成与导出</p>
          <div className="mt-3">
            <div className="text-2xl font-black">
              {s.todaySessionExists ? "已生成" : "未生成"}
            </div>
            <div className="text-xs text-[#8a979c]">
              今日训练包 · 待复习 {s.dueCount} 条
            </div>
          </div>
          <div className="mt-4">
            <Link href="/session" className="link-button btn-primary">
              {s.todaySessionExists ? "去练习 / 重导出" : "挑选并生成"}
            </Link>
          </div>
        </div>

        <div className="panel p-5" style={{ borderTop: "3px solid #D8A63A" }}>
          <h2 className="text-lg font-black text-[#8a6a1f]">③ 反馈与记录</h2>
          <p className="text-sm text-[#536267]">录入与报告</p>
          <div className="mt-3">
            <div className="text-2xl font-black">{s.transcriptCount}</div>
            <div className="text-xs text-[#8a979c]">
              {s.lastTranscriptAt
                ? `最近 ${s.lastTranscriptAt.slice(0, 10)}`
                : "暂无反馈"}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/transcript" className="link-button btn-primary">
              录入反馈
            </Link>
            <Link href="/assessment" className="link-button btn-secondary">
              学习报告
            </Link>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-base font-black">学习闭环</h2>
        <p className="mt-2 text-sm text-[#536267]">
          材料 → 学习库 → 今日训练 → 录入反馈 →（回流）更新学习库掌握度与复习调度。
          当前学习库共 {s.total} 条，今日 {s.today} 条已加入清单。
        </p>
      </section>
    </div>
  );
}
