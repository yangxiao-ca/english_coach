import { getAssessmentReportByDate } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json({ report: getAssessmentReportByDate(searchParams.get("date") || undefined) });
}
