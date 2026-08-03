"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function PasteForm() {
  const [form, setForm] = useState({
    title: "",
    topic: "",
    difficulty: "B1",
    purpose: "",
    content: ""
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage("正在提取 learning_items...");
    const res = await fetch("/api/materials/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setBusy(false);
    setMessage(
      res.ok
        ? `已生成 ${data.items.length} 个候选项，请到「待审」页面筛选。`
        : data.error
    );
  }

  return (
    <section className="panel grid gap-4 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        {["title", "topic", "difficulty", "purpose"].map((key) => (
          <label className="field" key={key}>
            <span className="label">{key}</span>
            <input
              value={(form as Record<string, string>)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <label className="field">
        <span className="label">material</span>
        <textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
      </label>
      <button disabled={busy} onClick={submit} className="btn-primary w-fit">
        提取 learning_items
      </button>
      {message && (
        <p className="text-sm font-semibold text-[#536267]">{message}</p>
      )}
    </section>
  );
}

function GenerateForm() {
  const [form, setForm] = useState({
    topic: "",
    difficulty: "B2",
    scenario: "",
    goal: "",
    count: 10
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setMessage("正在生成候选 learning_items...");
    const res = await fetch("/api/materials/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setBusy(false);
    setMessage(
      res.ok
        ? `已生成 ${data.items.length} 个候选项，请到「待审」页面筛选。`
        : data.error
    );
  }

  return (
    <section className="panel grid gap-4 p-5 md:grid-cols-2">
      <label className="field">
        <span className="label">topic</span>
        <input
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
        />
      </label>
      <label className="field">
        <span className="label">difficulty</span>
        <select
          value={form.difficulty}
          onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
        >
          <option value="B1">B1 - practical foundation</option>
          <option value="B2">B2 - natural adult speaking</option>
          <option value="C1">C1 - nuanced and precise</option>
          <option value="C2">C2 - advanced polish</option>
        </select>
      </label>
      <label className="field">
        <span className="label">scenario</span>
        <input
          value={form.scenario}
          onChange={(e) => setForm({ ...form, scenario: e.target.value })}
        />
      </label>
      <label className="field">
        <span className="label">goal</span>
        <input
          value={form.goal}
          onChange={(e) => setForm({ ...form, goal: e.target.value })}
        />
      </label>
      <label className="field">
        <span className="label">count</span>
        <input
          value={form.count}
          type="number"
          onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
        />
      </label>
      <div className="md:col-span-2">
        <button disabled={busy} onClick={submit} className="btn-primary">
          生成 learning_items
        </button>
      </div>
      {message && (
        <p className="text-sm font-semibold text-[#536267] md:col-span-2">
          {message}
        </p>
      )}
    </section>
  );
}

function AddMaterialInner() {
  const params = useSearchParams();
  const [tab, setTab] = useState<"paste" | "generate">(
    params.get("tab") === "generate" ? "generate" : "paste"
  );

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-black">添加材料</h1>
        <p className="mt-1 text-sm text-[#536267]">
          从外部文章/手动输入提取，或让 AI 按你的要求直接生成候选表达，审核后进入学习库。
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setTab("paste")}
          className={tab === "paste" ? "btn-primary" : "btn-secondary"}
        >
          粘贴导入
        </button>
        <button
          onClick={() => setTab("generate")}
          className={tab === "generate" ? "btn-primary" : "btn-secondary"}
        >
          AI 生成
        </button>
      </div>
      {tab === "paste" ? <PasteForm /> : <GenerateForm />}
    </div>
  );
}

export default function AddMaterialPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#536267]">加载中…</p>}>
      <AddMaterialInner />
    </Suspense>
  );
}
