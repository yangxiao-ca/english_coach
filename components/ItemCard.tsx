"use client";

import { useEffect, useState } from "react";

const studyPriorityOptions = ["重点学习", "一般学习", "简单熟悉"];
const familiarityOptions = ["完全陌生", "初步了解", "已经掌握"];
const editableTextFields = [
  "expression",
  "type",
  "meaning_cn",
  "explanation_en",
  "example_sentence",
  "speaking_scenario",
  "why_learn",
  "topic",
  "difficulty_level",
  "status"
];

function studiedLabel(value?: string | null) {
  if (!value) return "未学";
  const studied = new Date(value);
  if (Number.isNaN(studied.getTime())) return "未学";
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startStudied = new Date(studied.getFullYear(), studied.getMonth(), studied.getDate()).getTime();
  const days = Math.max(0, Math.floor((startToday - startStudied) / 86400000));
  if (days === 0) return "今天学过";
  return `${days} 天前学习`;
}

export function ItemCard({
  item,
  mode = "candidate",
  onChanged,
  onAddToTodayList,
  isInTodayList
}: {
  item: any;
  mode?: "candidate" | "library";
  onChanged?: () => void;
  onAddToTodayList?: (item: any) => void;
  isInTodayList?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(item);
  const [currentItem, setCurrentItem] = useState(item);

  useEffect(() => {
    setCurrentItem(item);
    setForm(item);
  }, [item]);

  async function action(status: string) {
    setBusy(true);
    await fetch(`/api/items/${currentItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setCurrentItem({ ...currentItem, status });
    setForm({ ...form, status });
    setBusy(false);
    onChanged?.();
  }

  async function remove() {
    setBusy(true);
    await fetch(`/api/items/${currentItem.id}`, { method: "DELETE" });
    setBusy(false);
    onChanged?.();
  }

  async function save() {
    setBusy(true);
    await fetch(`/api/items/${currentItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setBusy(false);
    setEditing(false);
    setCurrentItem({ ...currentItem, ...form });
    onChanged?.();
  }

  return (
    <article className="panel grid gap-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black">{currentItem.expression}</h3>
            <span className="rounded bg-mist px-2 py-1 text-xs font-bold text-[#536267]">{currentItem.type}</span>
            <span className="rounded bg-[#fff5dc] px-2 py-1 text-xs font-bold text-[#745817]">{currentItem.difficulty_level}</span>
            <span className="rounded bg-[#eef6f1] px-2 py-1 text-xs font-bold text-sage">{currentItem.status}</span>
            <span className="rounded bg-[#f4eef8] px-2 py-1 text-xs font-bold text-[#725184]">{currentItem.study_priority || "一般学习"}</span>
            <span className="rounded bg-[#eef2fb] px-2 py-1 text-xs font-bold text-[#4d628f]">{currentItem.familiarity_level || "完全陌生"}</span>
            <span className="rounded bg-[#f0f1ec] px-2 py-1 text-xs font-bold text-[#646b57]">{studiedLabel(currentItem.last_practiced_at)}</span>
          </div>
          <p className="mt-1 text-sm text-[#536267]">{currentItem.meaning_cn}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "candidate" ? (
            <>
              <button disabled={busy} onClick={() => action("active")} className="btn-primary">加入学习库</button>
              <button disabled={busy} onClick={() => action("later")} className="btn-secondary">以后再看</button>
              <button disabled={busy} onClick={() => action("ignored")} className="btn-danger">忽略</button>
            </>
          ) : (
            <>
              {(currentItem.status === "candidate" || currentItem.status === "later" || currentItem.status === "ignored") && (
                <button disabled={busy} onClick={() => action("active")} className="btn-primary">加入学习库</button>
              )}
              {onAddToTodayList && (
                <button disabled={busy || isInTodayList} onClick={() => onAddToTodayList(currentItem)} className={isInTodayList ? "btn-secondary" : "btn-primary"}>
                  {isInTodayList ? "已在今日清单" : "加入今日清单"}
                </button>
              )}
              {!onAddToTodayList && currentItem.status === "active" && (
                <button disabled={busy} onClick={() => action("today")} className="btn-primary">加入今日训练</button>
              )}
              {!onAddToTodayList && currentItem.status === "today" && (
                <button disabled={busy} onClick={() => action("active")} className="btn-secondary">取消今日训练</button>
              )}
              <button disabled={busy} onClick={() => setEditing(!editing)} className="btn-secondary">编辑</button>
              <button disabled={busy} onClick={remove} className="btn-danger">删除</button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="grid gap-3 md:grid-cols-2">
          {editableTextFields.map((key) => (
            <label key={key} className="field">
              <span className="label">{key}</span>
              <input value={form[key] ?? ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
            </label>
          ))}
          <label className="field">
            <span className="label">study_priority</span>
            <select value={form.study_priority || "一般学习"} onChange={(event) => setForm({ ...form, study_priority: event.target.value })}>
              {studyPriorityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="label">familiarity_level</span>
            <select value={form.familiarity_level || "完全陌生"} onChange={(event) => setForm({ ...form, familiarity_level: event.target.value })}>
              {familiarityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <button onClick={save} className="btn-primary md:col-span-2">保存</button>
        </div>
      ) : (
        <div className="grid gap-3 text-sm leading-6 md:grid-cols-2">
          <p><b>Explanation:</b> {currentItem.explanation_en}</p>
          <p><b>Example:</b> {currentItem.example_sentence}</p>
          <p><b>Why:</b> {currentItem.why_learn}</p>
          <p><b>Scenario:</b> {currentItem.speaking_scenario}</p>
          <p><b>Manual tags:</b> {currentItem.study_priority || "一般学习"} · {currentItem.familiarity_level || "完全陌生"}</p>
          <p><b>Scores:</b> AI {currentItem.ai_value_score} / Speaking {currentItem.speaking_usefulness_score} / Business {currentItem.business_relevance_score} / Personal {currentItem.personal_relevance_score}</p>
          <p><b>Learning time:</b> {studiedLabel(currentItem.last_practiced_at)} · {currentItem.last_practiced_at || "no record"}</p>
          <p><b>Review:</b> {currentItem.next_review_at || "not scheduled"} · activation {currentItem.speaking_activation_level ?? 0}</p>
        </div>
      )}
    </article>
  );
}
