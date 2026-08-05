"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import UsageGuide from "@/components/UsageGuide";

const providerDefaults: Record<string, { label: string; model: string; baseURL: string; hint: string }> = {
  deepseek: {
    label: "DeepSeek",
    model: "deepseek-v4-flash",
    baseURL: "https://api.deepseek.com",
    hint: "适合日常生成、评估和低成本练习闭环。"
  },
  glm: {
    label: "GLM / 智谱",
    model: "glm-5.2",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    hint: "中文说明、教学规划和中英混合场景表现自然。"
  },
  openai: {
    label: "OpenAI",
    model: "gpt-4.1-mini",
    baseURL: "",
    hint: "保留作为兼容选项。"
  }
};

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [tab, setTab] = useState<"ai" | "guide">("ai");
  const [provider, setProvider] = useState("deepseek");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(providerDefaults.deepseek.model);
  const [baseURL, setBaseURL] = useState(providerDefaults.deepseek.baseURL);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [message, setMessage] = useState("");
  const selected = useMemo(() => providerDefaults[provider] || providerDefaults.deepseek, [provider]);

  useEffect(() => {
    fetch("/api/settings/ai")
      .then((res) => res.json())
      .then((data) => {
        const settings = data.settings;
        setProvider(settings.provider);
        setModel(settings.model);
        setBaseURL(settings.baseURL);
        setHasApiKey(settings.hasApiKey);
      });
  }, []);

  // Keep tab in sync with ?tab=guide from the sidebar「使用说明」link.
  useEffect(() => {
    setTab(tabFromUrl === "guide" ? "guide" : "ai");
  }, [tabFromUrl]);

  function switchTab(next: "ai" | "guide") {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "guide") url.searchParams.set("tab", "guide");
    else url.searchParams.delete("tab");
    window.history.replaceState(null, "", url.toString());
  }

  function chooseProvider(nextProvider: string) {
    const next = providerDefaults[nextProvider];
    setProvider(nextProvider);
    setModel(next.model);
    setBaseURL(next.baseURL);
  }

  async function save() {
    setMessage("正在保存...");
    const res = await fetch("/api/settings/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, model, baseURL })
    });
    setMessage(res.ok ? "已保存。之后所有 AI 功能都会使用这套配置。" : "保存失败。");
    if (res.ok) {
      setHasApiKey(hasApiKey || Boolean(apiKey));
      setApiKey("");
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-black">设置</h1>
        <p className="mt-1 text-sm text-[#536267]">配置 AI 服务，或查看系统的完整使用说明与「学新词」标准。</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => switchTab("ai")}
          className={`rounded-lg px-4 py-2 text-sm font-black ${tab === "ai" ? "bg-ink text-white" : "bg-mist text-[#536267]"}`}
        >
          AI 设置
        </button>
        <button
          onClick={() => switchTab("guide")}
          className={`rounded-lg px-4 py-2 text-sm font-black ${tab === "guide" ? "bg-ink text-white" : "bg-mist text-[#536267]"}`}
        >
          使用说明
        </button>
      </div>

      {tab === "guide" ? (
        <UsageGuide />
      ) : (
        <div className="grid gap-5">
          <section className="grid gap-4 md:grid-cols-3">
            {Object.entries(providerDefaults).map(([key, option]) => (
              <button
                key={key}
                onClick={() => chooseProvider(key)}
                className={`panel p-4 text-left ${provider === key ? "border-ink ring-2 ring-ink" : ""}`}
              >
                <span className="block text-lg font-black">{option.label}</span>
                <span className="mt-2 block text-sm leading-6 text-[#536267]">{option.hint}</span>
              </button>
            ))}
          </section>

          <section className="panel grid gap-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="field">
                <span className="label">provider</span>
                <select value={provider} onChange={(event) => chooseProvider(event.target.value)}>
                  {Object.entries(providerDefaults).map(([key, option]) => (
                    <option key={key} value={key}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">model</span>
                <input value={model} onChange={(event) => setModel(event.target.value)} placeholder={selected.model} />
              </label>
            </div>

            <label className="field">
              <span className="label">api key {hasApiKey ? "（已保存，可留空不改）" : ""}</span>
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={hasApiKey ? "留空表示沿用已保存的 key" : "粘贴你的 API Key"}
              />
            </label>

            <label className="field">
              <span className="label">base url</span>
              <input value={baseURL} onChange={(event) => setBaseURL(event.target.value)} placeholder={selected.baseURL || "OpenAI 默认端点可留空"} />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button onClick={save} className="btn-primary">保存 AI 配置</button>
              {message && <p className="text-sm font-semibold text-[#536267]">{message}</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
