"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TranscriptPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [studySessionId, setStudySessionId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [practicedItemIds, setPracticedItemIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/sessions").then((res) => res.json()).then((data) => setSessions(data.sessions ?? []));
  }, []);

  async function chooseSession(nextSessionId: string) {
    setStudySessionId(nextSessionId);
    setPracticedItemIds([]);
    if (!nextSessionId) {
      setItems([]);
      return;
    }
    const res = await fetch(`/api/sessions/${nextSessionId}`);
    const data = await res.json();
    setItems(data.items ?? []);
  }

  async function submit() {
    setBusy(true);
    setMessage("正在评估转写，并更新复习时间...");
    const res = await fetch("/api/transcripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ study_session_id: studySessionId, transcript_text: transcript })
    });
    const data = await res.json();
    setBusy(false);
    setMessage(res.ok ? `评估完成，共 ${data.assessments.length} 条。` : data.error);
  }

  async function submitManualFeedback() {
    setBusy(true);
    setMessage("正在保存手动反馈，并更新复习时间...");
    const res = await fetch("/api/manual-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ study_session_id: studySessionId, practiced_item_ids: practicedItemIds })
    });
    const data = await res.json();
    setBusy(false);
    setMessage(res.ok ? `手动反馈完成，共更新 ${data.assessments.length} 个 item。` : data.error);
  }

  function toggleItem(itemId: number) {
    setPracticedItemIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    );
  }

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-black">转写评估</h1>
      <section className="panel grid gap-4 p-5">
        <label className="field">
          <span className="label">study_session</span>
          <select value={studySessionId} onChange={(e) => chooseSession(e.target.value)}>
            <option value="">选择一次训练</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>#{session.id} {session.title} · {session.created_at}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">豆包练习转写文本</span>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} className="min-h-72" />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={busy || !studySessionId || !transcript} onClick={submit} className="btn-primary">提交评估</button>
          <Link href="/assessment" className="font-bold text-sage">查看评估报告</Link>
        </div>
        {message && <p className="text-sm font-semibold text-[#536267]">{message}</p>}
      </section>

      <section className="panel grid gap-4 p-5">
        <div>
          <h2 className="text-xl font-black">没有录音/转写时：手动反馈</h2>
          <p className="mt-1 text-sm text-[#536267]">勾选今天已经学过或练过的表达。提交后，勾选项按 correct 更新为 7 天后复习，未勾选项按 not_used 明天继续练。</p>
        </div>

        {items.length ? (
          <div className="grid gap-3">
            {items.map((item) => (
              <label key={item.id} className="flex gap-3 rounded-lg border border-[#dfe5e7] bg-white p-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={practicedItemIds.includes(Number(item.id))}
                  onChange={() => toggleItem(Number(item.id))}
                />
                <span className="grid gap-1">
                  <span className="font-black">{item.expression}</span>
                  <span className="text-sm text-[#536267]">{item.meaning_cn}</span>
                  <span className="text-sm text-[#536267]">{item.example_sentence}</span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#536267]">先选择一次训练，就会显示今日学习包里的全部 item。</p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button disabled={busy || !studySessionId || !items.length} onClick={submitManualFeedback} className="btn-primary">
            提交手动反馈
          </button>
          <button disabled={!items.length} onClick={() => setPracticedItemIds(items.map((item) => Number(item.id)))} className="btn-secondary">
            全选
          </button>
          <button disabled={!items.length} onClick={() => setPracticedItemIds([])} className="btn-secondary">
            清空
          </button>
        </div>
      </section>
    </div>
  );
}
