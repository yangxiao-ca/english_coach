import { getItemsByIds, getStudySession, updateStudySessionPlan } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = getStudySession(Number(id));
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const itemIds = JSON.parse(session.target_item_ids || "[]");
  return NextResponse.json({ session: { ...session, plan: JSON.parse(session.plan_json) }, items: getItemsByIds(itemIds) });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  if (!body.plan) return NextResponse.json({ error: "Missing plan." }, { status: 400 });
  updateStudySessionPlan(Number(id), body.plan);
  return NextResponse.json({ ok: true });
}
