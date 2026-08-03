"use client";

import { useEffect, useState } from "react";

export default function AssessmentPage() {
  const [report, setReport] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");

  async function load(date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    const res = await fetch(`/api/assessments/reports${query}`);
    const data = await res.json();
    setReport(data.report);
    setSelectedDate(data.report?.selectedDate || "");
  }

  useEffect(() => {
    load();
  }, []);

  if (!report) {
    return (
      <div className="grid gap-5">
        <h1 className="text-2xl font-black">学习报告</h1>
        <div className="panel p-6 text-[#536267]">正在读取评估报告...</div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">学习报告</h1>
          <p className="mt-1 text-sm text-[#536267]">按日期查看每次练习后的 item 评估记录。</p>
        </div>
        <label className="field w-full max-w-xs">
          <span className="label">日期</span>
          <select value={selectedDate} onChange={(event) => load(event.target.value)}>
            {report.dates.length ? (
              report.dates.map((row: any) => (
                <option key={row.date} value={row.date}>{row.date} · {row.count} 条</option>
              ))
            ) : (
              <option value="">暂无评估日期</option>
            )}
          </select>
        </label>
      </div>

      {!report.sessions.length ? (
        <div className="panel p-6 text-[#536267]">这个日期暂无评估报告</div>
      ) : (
        report.sessions.map((sessionReport: any) => (
          <section key={sessionReport.session.id} className="grid gap-4">
            <div className="panel p-5">
              <p className="text-sm font-bold text-[#536267]">Session #{sessionReport.session.id} · {sessionReport.session.created_at}</p>
              <h2 className="mt-1 text-xl font-black">{sessionReport.session.title}</h2>
            </div>
            {sessionReport.assessments.map((row: any) => (
              <article key={row.id} className="panel grid gap-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-black">{row.expression}</h3>
                  <span className="rounded bg-mist px-2 py-1 text-sm font-black">{row.usage_status}</span>
                </div>
                <div className="grid gap-3 text-sm leading-6 md:grid-cols-2">
                  <p><b>使用质量：</b>{row.usage_quality_score}/5</p>
                  <p><b>错误类型：</b>{row.mistake_type || "无"}</p>
                  <p><b>证据摘录：</b>{row.evidence_excerpt || "未使用"}</p>
                  <p><b>更自然表达：</b>{row.better_expression}</p>
                  <p><b>下次建议：</b>{row.next_review_suggestion}</p>
                  <p><b>自动复习：</b>{row.next_review_at} · {row.review_status}</p>
                </div>
              </article>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
