import { createStudySession, getDueSessionItems, getItemStatusCounts, getItemsByIds, listStudySessions } from "@/lib/db";
import { generateSessionPlan } from "@/lib/llm";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ sessions: listStudySessions() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
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
      const selectedItems = getItemsByIds(itemIds) as any[];
      if (!selectedItems.length) {
        return NextResponse.json({ error: "没有找到选中的学习库 item。" }, { status: 404 });
      }
      const plan = await generateSessionPlan(selectedItems);
      const sessionId = createStudySession(plan, itemIds);
      return NextResponse.json({ sessionId, plan, items: selectedItems });
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
    const plan = await generateSessionPlan(items);
    const sessionId = createStudySession(plan, items.map((item: any) => item.id));
    return NextResponse.json({ sessionId, plan, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
