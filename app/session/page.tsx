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

const SCENARIO_PRESETS = [
  { value: "returning a product to a store", label: "商店退货" },
  { value: "making a polite complaint", label: "礼貌投诉" },
  { value: "calling customer service", label: "打客服电话" },
  { value: "ordering food at a restaurant", label: "餐厅点餐" },
  { value: "making a reservation", label: "预订 / 预约" },
  { value: "asking for directions", label: "问路" },
  { value: "checking out at a grocery store", label: "超市结账" },
  { value: "small talk with a coworker", label: "和同事闲聊" }
];

export default function SessionPage() {
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [draft, setDraft] = useState<Plan>(emptyPlan);
  const [committedItems, setCommittedItems] = useState<any[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [canActivateCandidates, setCanActivateCandidates] = useState(false);
  const [copied, setCopied] = useState(false);
  const [planMode, setPlanMode] = useState<"items" | "scenario">("items");
  const [scenarioPreset, setScenarioPreset] = useState(SCENARIO_PRESETS[0].value);
  const [scenarioCustom, setScenarioCustom] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadTodayPackage();
  }, []);

  // Single reload path: rebuild every view from the authoritative today endpoint.
  // Returns the parsed payload so callers can message based on fresh data (state updates are async).
  async function refreshToday() {
    const todayRes = await fetch("/api/sessions/today");
    const todayData = await todayRes.json();
    if (todayData.session) {
      setSessionId(todayData.session.id);
      setPlan(todayData.session.plan ?? null);
      setDraft(todayData.session.plan ?? emptyPlan);
      setCommittedItems(todayData.items ?? []);
    } else {
      setSessionId(null);
      setPlan(null);
      setDraft(emptyPlan);
      setCommittedItems([]);
    }
    setPendingItems(todayData.pending ?? []);
    return todayData;
  }

  async function loadTodayPackage() {
    setBusy(true);
    setError("");
    setMessage("正在读取今日学习信息...");
    const todayData = await refreshToday();
    const hasSession = Boolean(todayData.session);
    const pending = todayData.pending ?? [];
    if (!hasSession && pending.length) {
      setMessage("你已选好今日学习词条。确认后即可由 AI 生成今日训练内容；不需要的可以先退回学习库。");
    } else if (!hasSession && !pending.length) {
      setMessage("还没有选好的今日学习词条。请先去学习库把 item 加入「今日学习」，再到这里生成训练内容；也可以直接在这里从到期复习中 AI 生成，或创建空白学习包。");
    } else {
      setMessage("已加载今日学习包。你可以调整内容、删减词条，或清空后重新生成。");
    }
    setBusy(false);
  }

  // The exact set of words the page currently shows = what generation must include.
  function pageItemIds(): number[] {
    return Array.from(new Set([...committedItems, ...pendingItems].map((i) => Number(i.id))));
  }

  function effectiveScenario(): string {
    return scenarioCustom.trim() || scenarioPreset;
  }

  function planParams() {
    return planMode === "scenario"
      ? { plan_mode: "scenario" as const, scenario: effectiveScenario() }
      : { plan_mode: "items" as const };
  }

  // Context-aware (re)generate: staged -> generate from staged; none staged & no session -> due; session exists -> regenerate.
  async function generate() {
    setBusy(true);
    setError("");
    try {
      if (sessionId) {
        const ok = window.confirm("这会覆盖你手动调整的计划，确定用 AI 重新生成今日训练吗？");
        if (!ok) {
          setBusy(false);
          setMessage("已保留你当前的调整。");
          return;
        }
        setMessage("AI 正在重新生成今日训练内容...");
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "regenerate", item_ids: pageItemIds(), ...planParams() })
        });
        const data = await res.json();
        setBusy(false);
        if (!res.ok) {
          setError(data.error || "重新生成失败。");
          return;
        }
        await refreshToday();
        setMessage("已用 AI 重新生成今日训练（覆盖原调整）。");
        return;
      }
      if (pendingItems.length > 0) {
        setMessage("AI 正在根据你选好的词条生成今日训练内容...");
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "selected_ai",
            item_ids: pendingItems.map((i) => i.id),
            ...planParams()
          })
        });
        const data = await res.json();
        setBusy(false);
        if (!res.ok) {
          setError(data.error || "生成失败。");
          return;
        }
        await refreshToday();
        setMessage("今日学习包已生成，可以手动调整。");
        return;
      }
      setMessage("AI 正在生成今日学习包...");
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planParams())
      });
      const data = await res.json();
      setBusy(false);
      if (!res.ok) {
        setError(data.error);
        setCanActivateCandidates(Boolean((data.counts?.candidate || 0) + (data.counts?.later || 0)));
        return;
      }
      await refreshToday();
      setMessage("今日学习包已生成，可以手动调整。");
    } catch (e: any) {
      setBusy(false);
      setError(e.message || "生成失败。");
    }
  }

  async function createManual() {
    if (sessionId) {
      const ok = window.confirm("已存在今日训练包，创建空白包会覆盖它。确定继续吗？");
      if (!ok) return;
    }
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
      setError(data.error || "手动创建失败。");
      return;
    }
    await refreshToday();
    setMessage("已创建空白学习包。你可以完全手动填写并保存。");
  }

  async function appendSingle(itemId: number) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "append", item_ids: [itemId] })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "加入今日训练失败。");
      return;
    }
    await refreshToday();
    setMessage("已将该词条编入今日训练。");
  }

  async function appendBulk() {
    const ids = pendingItems.map((i) => i.id);
    if (!ids.length) return;
    setBusy(true);
    setError("");
    setMessage("正在把待加词条编入今日训练...");
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "append", item_ids: ids })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "加入今日训练失败。");
      return;
    }
    await refreshToday();
    setMessage("已将待加词条编入今日训练。");
  }

  async function removeFromToday(itemId: number) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/sessions/today", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remove_ids: [itemId] })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "移除词条失败。");
      return;
    }
    await refreshToday();
    setMessage("已从今日训练移除该词条（已退回「待加入」，可重新编入）。");
  }

  async function unstageItem(itemId: number) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" })
    });
    setBusy(false);
    if (!res.ok) {
      setError("退回学习库失败。");
      return;
    }
    setPendingItems((current) => current.filter((item) => Number(item.id) !== itemId));
    setMessage("已退回学习库。");
  }

  async function clearToday() {
    const ok = window.confirm(
      "这会清空当日 AI 已生成的内容，词条将退回「待加入」，你可以重新生成。确定清空吗？"
    );
    if (!ok) return;
    setBusy(true);
    setError("");
    setMessage("正在清空当日 AI 已生成内容...");
    const res = await fetch("/api/sessions/today", { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("清空失败。");
      return;
    }
    await refreshToday();
    setMessage("已清空当日 AI 已生成内容，词条已退回可选状态，可重新生成。");
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
    await generate();
  }

  const hasItems = committedItems.length > 0 || pendingItems.length > 0;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">今日训练</h1>
          {sessionId && <p className="mt-1 text-sm font-bold text-[#536267]">Study session #{sessionId}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={generate} className="btn-primary">
            {sessionId ? "重新生成今日训练" : "AI 生成今日训练材料"}
          </button>
          <a href="/library" className="btn-secondary link-button">去学习库选 item</a>
          <button disabled={busy} onClick={createManual} className="btn-secondary">创建空白包</button>
          <button disabled={saving || !sessionId} onClick={save} className="btn-secondary">保存调整</button>
        </div>
      </div>

      {message && <div className="panel p-4 text-sm font-semibold text-[#536267]">{message}</div>}

      {/* 练习模式：词条训练 / 场景练习 */}
      <div className="panel grid gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-[#536267]">练习模式</span>
          <button
            onClick={() => setPlanMode("items")}
            className={`rounded-lg px-3 py-1.5 text-sm font-black ${planMode === "items" ? "bg-ink text-white" : "bg-mist text-[#536267]"}`}
          >
            词条训练
          </button>
          <button
            onClick={() => setPlanMode("scenario")}
            className={`rounded-lg px-3 py-1.5 text-sm font-black ${planMode === "scenario" ? "bg-ink text-white" : "bg-mist text-[#536267]"}`}
          >
            场景练习
          </button>
        </div>
        {planMode === "scenario" && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="field">
                <span className="label">常用场景</span>
                <select value={scenarioPreset} onChange={(e) => setScenarioPreset(e.target.value)}>
                  {SCENARIO_PRESETS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">自定义场景（可选，优先于常用场景）</span>
                <input
                  value={scenarioCustom}
                  onChange={(e) => setScenarioCustom(e.target.value)}
                  placeholder="e.g. disputing a parking ticket"
                />
              </label>
            </div>
            <p className="text-xs leading-5 text-[#536267]">
              场景练习：豆包按「选场景 → 教 5-8 个表达 → 跟读造句 → 角色扮演 → 温和纠错 → 书面复习笔记」六步带你练；
              教的表达<b>严格就是你选中的词条</b>，练完把转写贴回「录入反馈」照常评估。
            </p>
          </>
        )}
      </div>

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

      {/* Items region — always visible so the staging options never disappear on generate */}
      {hasItems ? (
        <section className="grid gap-4">
          {committedItems.length > 0 && (
            <div className="panel p-5">
              <h3 className="font-black">本次训练包含的词条</h3>
              <p className="mt-1 text-sm text-[#536267]">
                以下词条已编入本次训练（权威清单见 study_sessions.target_item_ids）。不需要的可以直接移除，移除后会退回「待加入」，可再编入。
              </p>
              <div className="mt-3 grid gap-2">
                {committedItems.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-mist px-3 py-2">
                    <span className="text-sm"><b>{item.expression}</b> · {item.meaning_cn}</span>
                    <button disabled={busy} onClick={() => removeFromToday(Number(item.id))} className="btn-secondary !px-2 !py-1 text-xs">移除</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingItems.length > 0 && (
            <div className="panel grid gap-3 border-[#efc8c2] bg-[#fff7f5] p-5">
              <h3 className="font-black text-[#a33d33]">待加入今日训练（已在库选中，尚未编入）</h3>
              <p className="text-sm text-[#536267]">
                这些词条已在「今日学习」清单中，但还没编入本次训练。可一键编入，或退回学习库。
              </p>
              <div className="mt-3 grid gap-2">
                {pendingItems.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-3 py-2">
                    <span className="text-sm"><b>{item.expression}</b> · {item.meaning_cn}</span>
                    <span className="flex flex-wrap gap-2">
                      {sessionId && (
                        <button disabled={busy} onClick={() => appendSingle(Number(item.id))} className="btn-secondary !px-2 !py-1 text-xs">加入</button>
                      )}
                      <button disabled={busy} onClick={() => unstageItem(Number(item.id))} className="btn-secondary !px-2 !py-1 text-xs">退回学习库</button>
                    </span>
                  </div>
                ))}
              </div>
              {sessionId && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button disabled={busy || !pendingItems.length} onClick={appendBulk} className="btn-primary">全部加入今日训练</button>
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        <div className="panel grid gap-4 p-6 text-[#536267]">
          <p>还没有选好的今日学习词条。请先去学习库把 item 加入「今日学习」，再到这里生成训练内容；也可以直接在这里从到期复习中 AI 生成，或创建空白学习包。</p>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={generate} className="btn-primary">AI 生成今日训练材料</button>
            <a href="/library" className="btn-secondary link-button">去学习库选 item</a>
            <button disabled={busy} onClick={createManual} className="btn-secondary">创建空白包</button>
          </div>
        </div>
      )}

      {/* Plan region — generated content lives here; generating never wipes the items region above */}
      {plan ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-black">AI 已生成的训练内容</h3>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={clearToday} className="btn-secondary !border-[#efc8c2] !text-[#a33d33]">
                清空当日 AI 已生成内容
              </button>
            </div>
          </div>

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
              {committedItems.length ? (
                committedItems.map((item) => <p key={item.id} className="text-sm"><b>{item.expression}</b> · {item.meaning_cn}</p>)
              ) : (
                <p className="text-sm text-[#536267]">手动学习包可以只使用上方“今日目标表达”维护目标；不会绑定学习库 item。</p>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="panel grid gap-3 p-5 text-[#536267]">
          <p>还没有生成今日训练内容。确认上方词条后，点「AI 生成今日训练材料」即可生成（含豆包陪练指令）。</p>
        </div>
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
