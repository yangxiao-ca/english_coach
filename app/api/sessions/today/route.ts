import { getItemsByIds, getTodayStudySession } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = getTodayStudySession();
  if (!session) return NextResponse.json({ session: null, items: [] });

  const itemIds = JSON.parse(session.target_item_ids || "[]");
  return NextResponse.json({
    session: { ...session, plan: JSON.parse(session.plan_json) },
    items: getItemsByIds(itemIds)
  });
}
