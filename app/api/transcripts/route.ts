import { getItemsByIds, getStudySession, saveTranscriptAndAssessments } from "@/lib/db";
import { assessTranscript } from "@/lib/llm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = getStudySession(Number(body.study_session_id));
    if (!session) return NextResponse.json({ error: "Study session not found." }, { status: 404 });
    const itemIds = JSON.parse(session.target_item_ids || "[]");
    const items = getItemsByIds(itemIds);
    const assessments = await assessTranscript(items, body.transcript_text);
    const transcriptId = saveTranscriptAndAssessments(Number(body.study_session_id), body.transcript_text, assessments);
    return NextResponse.json({ transcriptId, assessments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
