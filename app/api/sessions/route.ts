import {
  appendToTodaySession,
  createStudySession,
  getAllStagedTodayIds,
  getDueSessionItems,
  getItemStatusCounts,
  getItemsByIds,
  getTodayStudySession,
  listStudySessions
} from "@/lib/db";
import { generateSessionPlan } from "@/lib/llm";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ sessions: listStudySessions() });
}

function unionNumbers(...lists: number[][]): number[] {
  return Array.from(new Set(lists.flat().map((id) => Number(id))));
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const stagedIds = getAllStagedTodayIds();

    if (body.mode === "manual") {
      const itemIds = (body.item_ids || []).map((id: string | number) => Number(id)).filter(Boolean);
      const selectedItems = getItemsByIds(itemIds) as any[];
      const plan = {
        title: body.plan?.title || "手动今日学习包",
        target_expressions: body.plan?.target_expressions?.length
          ? body.plan.target_expressions
          : selectedItems.map((item) => item.expression),
        sentence_drills: body.plan?.sentence_drills || [],
        scenario_tasks: body.plan?.scenario_tasks || [],
        speaking_task_30s: body.plan?.speaking_task_30s || "",
        speaking_task_90s: body.plan?.speaking_task_90s || "",
        doubao_prompt: body.plan?.doubao_prompt || ""
      };
      const sessionId = createStudySession(plan, itemIds);
      return NextResponse.json({ sessionId, plan, items: selectedItems });
    }

    if (body.mode === "selected_ai") {
      const itemIds = (body.item_ids || []).map((id: string | number) => Number(id)).filter(Boolean);
      if (!itemIds.length) {
        return NextResponse.json({ error: "请先从学习库选择至少一个 item。" }, { status: 400 });
      }
      // Always commit the explicit selection together with any other staged items, so nothing is left orphaned.
      const commitIds = unionNumbers(itemIds, stagedIds);
      const selectedItems = getItemsByIds(commitIds) as any[];
      if (!selectedItems.length) {
        return NextResponse.json({ error: "没有找到选中的学习库 item。" }, { status: 404 });
      }
      const plan = await generateSessionPlan(selectedItems);
      const sessionId = createStudySession(plan, commitIds);
      return NextResponse.json({ sessionId, plan, items: selectedItems });
    }

    if (body.mode === "append") {
      const itemIds = (body.item_ids || []).map((id: string | number) => Number(id)).filter(Boolean);
      if (!itemIds.length) {
        return NextResponse.json({ error: "请提供要加入今日训练的词条。" }, { status: 400 });
      }
      const result = appendToTodaySession(itemIds);
      if (!result) {
        return NextResponse.json({ error: "请先生成今日训练包，再追加词条。" }, { status: 400 });
      }
      return NextResponse.json({
        session: { ...result.session, plan: JSON.parse(result.session.plan_json) },
        items: result.items
      });
    }

    if (body.mode === "regenerate") {
      const existing = getTodayStudySession();
      if (!existing) {
        return NextResponse.json({ error: "还没有今日训练包可重新生成。" }, { status: 400 });
      }
      // Explicit overwrite: regenerate the plan for the current binding + any still-staged items.
      const commitIds = unionNumbers(JSON.parse(existing.target_item_ids || "[]"), stagedIds);
      const items = getItemsByIds(commitIds) as any[];
      const plan = await generateSessionPlan(items);
      const sessionId = createStudySession(plan, commitIds);
      return NextResponse.json({ sessionId, plan, items });
    }

    // Default (no mode): generate a fresh package only when none exists; otherwise safely reload
    // the existing one instead of silently clobbering any hand-edited plan.
    const existing = getTodayStudySession();
    if (existing) {
      const itemIds = JSON.parse(existing.target_item_ids || "[]");
      return NextResponse.json({
        sessionId: existing.id,
        plan: JSON.parse(existing.plan_json),
        items: getItemsByIds(itemIds)
      });
    }
    const items = getDueSessionItems(8);
    if (!items.length) {
      const counts = getItemStatusCounts();
      return NextResponse.json(
        {
          error:
            (counts.candidate || counts.later)
              ? `现在有 ${counts.candidate || 0} 个候选项、${counts.later || 0} 个以后再看项，但还没有加入学习库的 active learning_items。`
              : "学习库里还没有可训练的 active learning_items。",
          counts
        },
        { status: 400 }
      );
    }
    // Commit the auto-selected items together with any staged items, so staged ones are not orphaned.
    const commitIds = unionNumbers(
      items.map((item: any) => item.id),
      stagedIds
    );
    const plan = await generateSessionPlan(getItemsByIds(commitIds) as any[]);
    const sessionId = createStudySession(plan, commitIds);
    return NextResponse.json({ sessionId, plan, items: getItemsByIds(commitIds) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
