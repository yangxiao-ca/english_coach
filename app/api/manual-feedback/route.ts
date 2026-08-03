import { getItemsByIds, getStudySession, saveTranscriptAndAssessments } from "@/lib/db";
import { AssessmentInput } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = Number(body.study_session_id);
    const practicedIds = new Set<number>((body.practiced_item_ids || []).map((id: string | number) => Number(id)));
    const session = getStudySession(sessionId);

    if (!session) return NextResponse.json({ error: "Study session not found." }, { status: 404 });

    const itemIds = JSON.parse(session.target_item_ids || "[]") as number[];
    const items = getItemsByIds(itemIds) as any[];
    const assessments: AssessmentInput[] = items.map((item) => {
      const practiced = practicedIds.has(Number(item.id));
      return {
        learning_item_id: Number(item.id),
        usage_status: practiced ? "correct" : "not_used",
        usage_quality_score: practiced ? 3 : 1,
        mistake_type: practiced ? "" : "underuse",
        evidence_excerpt: practiced ? "Manual feedback: learner marked this item as practiced today." : "",
        better_expression: practiced ? item.example_sentence || item.expression : item.example_sentence || item.expression,
        next_review_suggestion: practiced ? "已手动标记为今天练过，7 天后复习。" : "今天未勾选为已练习，明天继续练。"
      };
    });

    const transcriptText = `Manual feedback. Practiced item ids: ${Array.from(practicedIds).join(", ") || "none"}`;
    const transcriptId = saveTranscriptAndAssessments(sessionId, transcriptText, assessments);

    return NextResponse.json({ transcriptId, assessments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
