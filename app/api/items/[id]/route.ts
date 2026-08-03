import { deleteItem, updateItem, updateItemStatus } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  if (body.status && Object.keys(body).length === 1) updateItemStatus(Number(id), body.status);
  else {
    updateItem(Number(id), body);
    if (body.status) updateItemStatus(Number(id), body.status);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  deleteItem(Number(id));
  return NextResponse.json({ ok: true });
}
