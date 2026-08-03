"use client";

import { useState } from "react";

export default function GenerateMaterialPage() {
  const [form, setForm] = useState({ topic: "", difficulty: "B2", scenario: "", goal: "", count: 10 });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage("正在生成候选 learning_items...");
    const res = await fetch("/api/materials/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setBusy(false);
    setMessage(res.ok ? `已生成 ${data.items.length} 个候选项，请到候选项页面筛选。` : data.error);
  }

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-black">生成材料</h1>
      <section className="panel grid gap-4 p-5 md:grid-cols-2">
        <label className="field">
          <span className="label">topic</span>
          <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
        </label>
        <label className="field">
          <span className="label">difficulty</span>
          <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
            <option value="B1">B1 - practical foundation</option>
            <option value="B2">B2 - natural adult speaking</option>
            <option value="C1">C1 - nuanced and precise</option>
            <option value="C2">C2 - advanced polish</option>
          </select>
        </label>
        <label className="field">
          <span className="label">scenario</span>
          <input value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} />
        </label>
        <label className="field">
          <span className="label">goal</span>
          <input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
        </label>
        <label className="field">
          <span className="label">count</span>
          <input value={form.count} type="number" onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} />
        </label>
        <div className="md:col-span-2">
          <button disabled={busy} onClick={submit} className="btn-primary">生成 learning_items</button>
        </div>
        {message && <p className="text-sm font-semibold text-[#536267] md:col-span-2">{message}</p>}
      </section>
    </div>
  );
}
