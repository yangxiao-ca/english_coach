"use client";

import { useEffect, useState } from "react";
import { ItemCard } from "./ItemCard";

export function ItemsList({ status, mode }: { status?: string; mode: "candidate" | "library" }) {
  const [items, setItems] = useState<any[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [todayList, setTodayList] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const query = new URLSearchParams({ ...filters });
    if (status) query.set("status", status);
    if (mode === "library") query.set("library_scope", "1");
    const res = await fetch(`/api/items?${query}`);
    const data = await res.json();
    setItems(data.items ?? []);
  }

  function addToTodayList(item: any) {
    setMessage("");
    setTodayList((current) => current.some((selected) => Number(selected.id) === Number(item.id)) ? current : [...current, item]);
  }

  function removeFromTodayList(itemId: number) {
    setTodayList((current) => current.filter((item) => Number(item.id) !== itemId));
  }

  async function confirmTodayList() {
    if (!todayList.length) {
      setMessage("请先选择至少一个 item。");
      return;
    }
    setBusy(true);
    setMessage("AI 正在根据今日清单补齐学习资料...");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "selected_ai", item_ids: todayList.map((item) => item.id) })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error || "AI 补齐学习资料失败。");
      return;
    }
    window.location.href = "/session";
  }

  useEffect(() => {
    load();
  }, [
    status,
    filters.type,
    filters.topic,
    filters.difficulty_level,
    filters.study_priority,
    filters.familiarity_level,
    filters.ai_value_score,
    filters.speaking_usefulness_score,
    filters.business_relevance_score,
    filters.personal_relevance_score,
    filters.last_studied
  ]);

  return (
    <div className="grid gap-4">
      {mode === "library" && (
        <>
          <div className="panel grid gap-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">今日学习清单</h2>
                <p className="mt-1 text-sm text-[#536267]">从下面筛选后的学习库里逐个加入，确认后 AI 会补齐今日训练资料。</p>
              </div>
              <button disabled={busy || !todayList.length} onClick={confirmTodayList} className="btn-primary">确认并 AI 补齐</button>
            </div>
            {todayList.length ? (
              <div className="flex flex-wrap gap-2">
                {todayList.map((item) => (
                  <span key={item.id} className="inline-flex items-center gap-2 rounded bg-mist px-2 py-1 text-sm font-bold text-[#536267]">
                    {item.expression}
                    <button disabled={busy} onClick={() => removeFromTodayList(Number(item.id))} className="btn-secondary !px-2 !py-1 text-xs">移除</button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#536267]">今日清单为空。</p>
            )}
            {message && <p className="text-sm font-semibold text-[#536267]">{message}</p>}
          </div>

          <div className="panel grid gap-3 p-4 md:grid-cols-4 lg:grid-cols-8">
            <select value={filters.type ?? ""} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              <option value="">全部类型</option>
              <option value="word">word</option>
              <option value="phrase">phrase</option>
              <option value="collocation">collocation</option>
              <option value="sentence_pattern">sentence_pattern</option>
              <option value="golden_expression">golden_expression</option>
            </select>
            <input placeholder="topic" value={filters.topic ?? ""} onChange={(e) => setFilters({ ...filters, topic: e.target.value })} />
            <select value={filters.difficulty_level ?? ""} onChange={(e) => setFilters({ ...filters, difficulty_level: e.target.value })}>
              <option value="">全部难度</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
            <select value={filters.study_priority ?? ""} onChange={(e) => setFilters({ ...filters, study_priority: e.target.value })}>
              <option value="">全部重点</option>
              <option value="重点学习">重点学习</option>
              <option value="一般学习">一般学习</option>
              <option value="简单熟悉">简单熟悉</option>
            </select>
            <select value={filters.familiarity_level ?? ""} onChange={(e) => setFilters({ ...filters, familiarity_level: e.target.value })}>
              <option value="">全部熟悉度</option>
              <option value="完全陌生">完全陌生</option>
              <option value="初步了解">初步了解</option>
              <option value="已经掌握">已经掌握</option>
            </select>
            <ScoreFilter label="AI >=" value={filters.ai_value_score ?? ""} onChange={(value) => setFilters({ ...filters, ai_value_score: value })} />
            <ScoreFilter label="Speaking >=" value={filters.speaking_usefulness_score ?? ""} onChange={(value) => setFilters({ ...filters, speaking_usefulness_score: value })} />
            <ScoreFilter label="Business >=" value={filters.business_relevance_score ?? ""} onChange={(value) => setFilters({ ...filters, business_relevance_score: value })} />
            <ScoreFilter label="Personal >=" value={filters.personal_relevance_score ?? ""} onChange={(value) => setFilters({ ...filters, personal_relevance_score: value })} />
            <select value={filters.last_studied ?? ""} onChange={(e) => setFilters({ ...filters, last_studied: e.target.value })}>
              <option value="">全部学习时间</option>
              <option value="unlearned">未学</option>
              <option value="today">今天学过</option>
              <option value="1">1 天前或更早</option>
              <option value="3">3 天前或更早</option>
              <option value="7">7 天前或更早</option>
              <option value="14">14 天前或更早</option>
              <option value="30">30 天前或更早</option>
            </select>
          </div>
        </>
      )}
      {items.length === 0 ? (
        <div className="panel p-6 text-[#536267]">暂无数据</div>
      ) : items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          mode={mode}
          onChanged={load}
          onAddToTodayList={mode === "library" ? addToTodayList : undefined}
          isInTodayList={todayList.some((selected) => Number(selected.id) === Number(item.id))}
        />
      ))}
    </div>
  );
}

function ScoreFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{label} 全部</option>
      {[1, 2, 3, 4, 5].map((score) => (
        <option key={score} value={score}>{label} {score}</option>
      ))}
    </select>
  );
}
