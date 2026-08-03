"use client";

import { useState } from "react";

export default function InputMaterialPage() {
  const [form, setForm] = useState({ title: "", topic: "", difficulty: "B1", purpose: "", content: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage("正在提取 learning_items...");
    const res = await fetch("/api/materials/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setBusy(false);
    setMessage(res.ok ? `已生成 ${data.items.length} 个候选项，请到候选项页面筛选。` : data.error);
  }

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-black">输入材料</h1>
      <section className="panel grid gap-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {["title", "topic", "difficulty", "purpose"].map((key) => (
            <label className="field" key={key}>
              <span className="label">{key}</span>
              <input value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </label>
          ))}
        </div>
        <label className="field">
          <span className="label">material</span>
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </label>
        <button disabled={busy} onClick={submit} className="btn-primary w-fit">提取 learning_items</button>
        {message && <p className="text-sm font-semibold text-[#536267]">{message}</p>}
      </section>
    </div>
  );
}
