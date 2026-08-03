import { insertLearningItems, insertMaterial } from "@/lib/db";
import { extractItemsFromMaterial } from "@/lib/llm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const materialId = insertMaterial(body);
    const items = await extractItemsFromMaterial(body);
    insertLearningItems(items, "candidate", materialId, body.topic);
    return NextResponse.json({ materialId, items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
