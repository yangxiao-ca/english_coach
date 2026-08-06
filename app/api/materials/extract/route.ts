import { insertLearningItems, insertMaterial } from "@/lib/db";
import { extractItemsFromMaterial } from "@/lib/llm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const materialId = insertMaterial(body);
    const items = await extractItemsFromMaterial({
      title: body.title,
      topic: body.topic,
      difficulty: body.difficulty,
      purpose: body.purpose,
      content: body.content,
      extraRequirements: body.extraRequirements
    });
    insertLearningItems(items, "candidate", materialId, body.topic);
    return NextResponse.json({ materialId, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
