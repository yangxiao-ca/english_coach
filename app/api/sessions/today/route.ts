import { clearTodaySession, detachFromTodaySession, getTodayItems } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const { session, committed, pending } = getTodayItems();
  if (!session) return NextResponse.json({ session: null, items: [], pending: [] });

  return NextResponse.json({
    session: { ...session, plan: JSON.parse(session.plan_json) },
    items: committed,
    pending
  });
}

// Remove specific items from today's session (they go back to the staged pool).
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const removeIds = (body.remove_ids || []).map((id: string | number) => Number(id)).filter(Boolean);
  if (!removeIds.length) {
    return NextResponse.json({ error: "请提供要移除的词条。" }, { status: 400 });
  }
  const result = detachFromTodaySession(removeIds);
  if (!result) {
    return NextResponse.json({ error: "请先生成今日训练包。" }, { status: 400 });
  }
  return NextResponse.json({
    session: { ...result.session, plan: JSON.parse(result.session.plan_json) },
    items: result.committed,
    pending: result.pending
  });
}

// Clear the AI-generated content for today; items return to the staged pool.
export async function DELETE() {
  clearTodaySession();
  return NextResponse.json({ ok: true });
}
