import { getAiSettings, saveAiSettings } from "@/lib/db";
import { NextResponse } from "next/server";

const defaults: Record<string, { model: string; baseURL: string }> = {
  deepseek: { model: "deepseek-v4-flash", baseURL: "https://api.deepseek.com" },
  glm: { model: "glm-5.2", baseURL: "https://open.bigmodel.cn/api/paas/v4" },
  openai: { model: "gpt-4.1-mini", baseURL: "" }
};

export async function GET() {
  const saved = getAiSettings();
  const provider = saved.provider || process.env.AI_PROVIDER || "deepseek";
  const fallback = defaults[provider] || defaults.deepseek;

  return NextResponse.json({
    settings: {
      provider,
      model: saved.model || process.env.AI_MODEL || fallback.model,
      baseURL: saved.baseURL || process.env.AI_BASE_URL || fallback.baseURL,
      hasApiKey: Boolean(saved.apiKey || process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.GLM_API_KEY || process.env.OPENAI_API_KEY)
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const provider = String(body.provider || "deepseek");
  const fallback = defaults[provider] || defaults.deepseek;

  saveAiSettings({
    provider,
    apiKey: body.apiKey ? String(body.apiKey) : undefined,
    model: String(body.model || fallback.model),
    baseURL: String(body.baseURL ?? fallback.baseURL)
  });

  return NextResponse.json({ ok: true });
}
