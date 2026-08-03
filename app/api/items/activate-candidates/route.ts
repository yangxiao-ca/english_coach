import { activateCandidateItems } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  const count = activateCandidateItems();
  return NextResponse.json({ count });
}
