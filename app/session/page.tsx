"use client";

import { useEffect, useRef, useState } from "react";

type Plan = {
  title: string;
  target_expressions: string[];
  sentence_drills: string[];
  scenario_tasks: string[];
  speaking_task_30s: string;
  speaking_task_90s: string;
  doubao_prompt: string;
};

const emptyPlan: Plan = {
  title: "",
  target_expressions: [],
  sentence_drills: [],
  scenario_tasks: [],
  speaking_task_30s: "",
  speaking_task_90s: "",
  doubao_prompt: ""
};

export default function SessionPage() {
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [draft, setDraft] = useState<Plan>(emptyPlan);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [canActivateCandidates, setCanActivateCandidates] = useState(false);
  const [copied, setCopied] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadTodayPackage();
  }, []);

  async function loadTodayPackage() {
    setBusy(true);
    setError("");
    setMessage("正在读取今日学习信息...");
    const [todayRes, itemsRes] = await Promise.all([
      fetch("/api/sessions/today"),
      fetch("/api/items?status=today")
    ]);
    const todayData = await todayRes.json();
    const itemsData = await itemsRes.json();
    const todayItems = itemsData.items ?? [];
    setSelectedItems(todayItems);
    if (todayData.session) {
      applySession(todayData.session.id, todayData.session.plan, todayData.items);
      setMessage(
        todayItems.length
          ? "已加载今日学习包。下方还有你从学习库选好、尚未编入本次训练的词条，可移除或确认生成。"
          : "已加载今日学习包，你可以直接调整后保存。"
      );
      setBusy(false);
      return;
    }
    setMessage(
      todayItems.length
        ? "你已选好今日学习词条。确认后即可由 AI 生成今日训练内容。"
        : "还没有选好的今日学习词条。请先去学习库把 item 加入「今日学习」，再到这里生成训练内容。"
    );
    setBusy(false);
  }

  function applySession(id: number, nextPlan: Plan, nextItems: any[]) {
    setSessionId(id);
    setPlan(nextPlan);
    setDraft(nextPlan);
    setItems(nextItems);
    setCanActivateCandidates(false);
  }

  async function removeSelected(itemId: number) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" })
    });
    setBusy(false);
    if (!res.ok) {
      setError("移除词条失败。");
      return;
    }
    setSelectedItems((current) => current.filter((item) => Number(item.id) !== itemId));
    setMessage("已从今日学习移除该词条。");
  }

  async function generateFromSelected() {
    const ids = selectedItems.map((item) => item.id);
    if (!ids.length) return;
    setBusy(true);
    setError("");
    setMessage("AI 正在根据你选好的词条生成今日训练内容...");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "selected_ai", item_ids: ids })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "生成失败。");
      return;
    }
    applySession(data.sessionId, data.plan, data.items);
    setSelectedItems([]);
    setMessage("今日学习包已生成，可以手动调整。");
  }

  async function create() {
    setBusy(true);
    setError("");
    setMessage("AI 正在生成今日学习包...");
    const res = await fetch("/api/sessions", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage("");
      setError(data.error);
      setCanActivateCandidates(Boolean((data.counts?.candidate || 0) + (data.counts?.later || 0)));
      return;
    }
    applySession(data.sessionId, data.plan, data.items);
    setMessage("今日学习包已生成，可以手动调整。");
  }

  async function createManual() {
    setBusy(true);
    setError("");
    setMessage("正在创建空白学习包...");
    const manualPlan: Plan = {
      title: "手动今日学习包",
      target_expressions: [],
      sentence_drills: [],
      scenario_tasks: [],
      speaking_task_30s: "",
      speaking_task_90s: "",
      doubao_prompt:
        "Please coach me in English only. I will give you the expressions I want to learn today. For each expression, explain it in simple English, give me one natural full sentence, ask me to repeat it, then ask me to make my own sentence. Correct me briefly and give me a more natural version. At the end, give me a clean transcript of our practice."
    };
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "manual", plan: manualPlan, item_ids: [] })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage("");
      setError(data.error || "手动创建失败。");
      return;
    }
    applySession(data.sessionId, data.plan, data.items);
    setMessage("已创建空白学习包。你可以完全手动填写并保存。");
  }

  async function save() {
    if (!sessionId) return;
    setSaving(true);
    setMessage("正在保存你的调整...");
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: draft })
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("保存失败。");
      return;
    }
    setPlan(draft);
    setMessage("已保存调整。豆包指令会使用最新版本。");
  }

  async function copyDoubaoPrompt() {
    await navigator.clipboard.writeText(draft.doubao_prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function activateCandidatesAndRetry() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/items/activate-candidates", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok || !data.count) {
      setError("没有可加入学习库的候选项。");
      return;
    }
    await create();
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">今日训练</h1>
          {sessionId && <p className="mt-1 text-sm font-bold text-[#536267]">Study session #{sessionId}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={create} className="btn-secondary">AI 自动生成</button>
          <a href="/library" className="btn-secondary link-button">去学习库选 item</a>
          <button disabled={busy} onClick={createManual} className="btn-secondary">创建空白包</button>
          <button disabled={saving || !sessionId} onClick={save} className="btn-primary">保存调整</button>
        </div>
      </div>

      {message && <div className="panel p-4 text-sm font-semibold text-[#536267]">{message}</div>}

      {error && (
        <div className="panel grid gap-3 border-[#efc8c2] bg-[#fff7f5] p-4 text-sm font-semibold text-[#a33d33]">
          <p>{error}</p>
          {canActivateCandidates && (
            <button disabled={busy} onClick={activateCandidatesAndRetry} className="btn-primary w-fit">
              把候选项加入学习库并重试
            </button>
          )}
        </div>
      )}

      {selectedItems.length > 0 && (
        <section className="grid gap-4">
          <div className="panel p-5">
            <h3 className="font-black">本次选好的学习词条</h3>
            <p className="mt-1 text-sm text-[#536267]">以下词条已从学习库加入今日学习，确认后由 AI 据此生成今日训练内容（含豆包陪练指令）。不需要的可以直接移除。</p>
            <div className="mt-3 grid gap-2">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-mist px-3 py-2">
                  <span className="text-sm"><b>{item.expression}</b> · {item.meaning_cn}</span>
                  <button disabled={busy} onClick={() => removeSelected(Number(item.id))} className="btn-secondary !px-2 !py-1 text-xs">移除</button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy || !selectedItems.length} onClick={generateFromSelected} className="btn-primary">确认并 AI 生成学习内容</button>
            <a href="/library" className="btn-secondary link-button">返回学习库调整</a>
          </div>
        </section>
      )}

      {plan ? (
        <section className="grid gap-4">
          <div className="panel grid gap-3 p-5">
            <label className="field">
              <span className="label">学习包标题</span>
              <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <EditableLines title="今日目标表达" value={draft.target_expressions} onChange={(value) => setDraft({ ...draft, target_expressions: value })} />
            <EditableLines title="句型训练" value={draft.sentence_drills} onChange={(value) => setDraft({ ...draft, sentence_drills: value })} />
            <EditableLines title="场景任务" value={draft.scenario_tasks} onChange={(value) => setDraft({ ...draft, scenario_tasks: value })} />
            <div className="panel grid gap-3 p-5">
              <h3 className="font-black">口语任务</h3>
              <label className="field">
                <span className="label">30秒任务</span>
                <textarea value={draft.speaking_task_30s} onChange={(event) => setDraft({ ...draft, speaking_task_30s: event.target.value })} />
              </label>
              <label className="field">
                <span className="label">90秒任务</span>
                <textarea value={draft.speaking_task_90s} onChange={(event) => setDraft({ ...draft, speaking_task_90s: event.target.value })} />
              </label>
            </div>
          </div>

          <div className="panel grid gap-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-black">豆包智能体陪练指令</h3>
              <button className={copied ? "btn-primary" : "btn-secondary"} onClick={copyDoubaoPrompt}>
                {copied ? "✓ 已复制" : "复制"}
              </button>
            </div>
            <textarea value={draft.doubao_prompt} onChange={(event) => setDraft({ ...draft, doubao_prompt: event.target.value })} className="min-h-64" />
          </div>

          <div className="panel p-5">
            <h3 className="font-black">本次目标 learning_items</h3>
            <div className="mt-3 grid gap-2">
              {items.length ? (
                items.map((item) => <p key={item.id} className="text-sm"><b>{item.expression}</b> · {item.meaning_cn}</p>)
              ) : (
                <p className="text-sm text-[#536267]">手动学习包可以只使用上方“今日目标表达”维护目标；不会绑定学习库 item。</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        selectedItems.length === 0 && (
          <div className="panel grid gap-4 p-6 text-[#536267]">
            <p>还没有选好的今日学习词条。请先去学习库把 item 加入「今日学习」，再到这里生成训练内容；也可以直接在这里从到期复习中 AI 生成，或创建空白学习包。</p>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={create} className="btn-primary">AI 自动生成</button>
              <a href="/library" className="btn-secondary link-button">去学习库选 item</a>
              <button disabled={busy} onClick={createManual} className="btn-secondary">创建空白包</button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function EditableLines({ title, value, onChange }: { title: string; value: string[]; onChange: (value: string[]) => void }) {
  return (
    <div className="panel grid gap-3 p-5">
      <h3 className="font-black">{title}</h3>
      <textarea
        value={(value || []).join("\n")}
        onChange={(event) => onChange(event.target.value.split("\n").map((line) => line.trim()).filter(Boolean))}
      />
    </div>
  );
}
