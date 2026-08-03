import { updateItemStatus } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const ids = (body.ids || []).map((id: string | number) => Number(id)).filter(Boolean);
  if (!ids.length) {
    return NextResponse.json({ error: "请提供要加入今日学习的 item id。" }, { status: 400 });
  }
  for (const id of ids) updateItemStatus(id, "today");
  return NextResponse.json({ ok: true, count: ids.length });
}
