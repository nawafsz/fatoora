import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { auditLog } from "@/lib/audit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { id, itemId } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const item = await db.bOQItem.findFirst({
    where: { id: itemId, projectId: id },
  });
  if (!item) return NextResponse.json({ error: "البند غير موجود" }, { status: 404 });

  const json = await req.json();
  const data: Record<string, unknown> = {};

  const allowed = ["code", "description", "unit", "quantity", "unitPrice", "category", "sortOrder"];
  for (const key of allowed) {
    if (json[key] !== undefined) data[key] = json[key];
  }
  if (json.quantity !== undefined || json.unitPrice !== undefined) {
    const qty = json.quantity ?? Number(item.quantity);
    const price = json.unitPrice ?? Number(item.unitPrice);
    data.totalPrice = qty * price;
  }

  const updated = await db.bOQItem.update({
    where: { id: itemId },
    data: data as any,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const csrf = csrfGuard(_req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { id, itemId } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  await db.bOQItem.delete({ where: { id: itemId } });

  return NextResponse.json({ success: true });
}
