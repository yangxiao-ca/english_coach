import { insertLearningItems, insertMaterial } from "@/lib/db";
import { generateItems } from "@/lib/llm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = await generateItems({ ...body, count: Number(body.count || 10) });
    const materialId = insertMaterial({
      title: `AI generated: ${body.topic}`,
      topic: body.topic,
      difficulty: body.difficulty,
      purpose: body.goal,
      content: JSON.stringify(body),
      source_type: "ai_generated"
    });
    insertLearningItems(items, "candidate", materialId, body.topic);
    return NextResponse.json({ materialId, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
