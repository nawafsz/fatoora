import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { decryptSensitive } from "@/lib/encryption";
import { auditLog } from "@/lib/audit";

const SUBCONTRACTOR_FIELDS = ["name", "phone", "taxNumber"] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { id, subId } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const sub = await db.subcontract.findFirst({
    where: { id: subId, projectId: id },
    include: {
      subcontractor: { select: { id: true, name: true, taxNumber: true, phone: true } },
      claims: { orderBy: { claimNumber: "desc" } },
    },
  });
  if (!sub) return NextResponse.json({ error: "عقد الباطن غير موجود" }, { status: 404 });

  const decrypted = {
    ...sub,
    subcontractor: sub.subcontractor
      ? decryptSensitive(sub.subcontractor as Record<string, unknown>, SUBCONTRACTOR_FIELDS) as typeof sub.subcontractor
      : sub.subcontractor,
  };

  return NextResponse.json(decrypted);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { id, subId } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const sub = await db.subcontract.findFirst({
    where: { id: subId, projectId: id },
  });
  if (!sub) return NextResponse.json({ error: "عقد الباطن غير موجود" }, { status: 404 });

  const json = await req.json();
  const allowed = ["scope", "contractValue", "retentionRate", "advancePayment", "status", "startDate", "endDate", "notes"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (json[key] !== undefined) {
      data[key] = key === "startDate" || key === "endDate" ? (json[key] ? new Date(json[key]) : null) : json[key];
    }
  }

  const updated = await db.subcontract.update({
    where: { id: subId },
    data: data as any,
  });

  await auditLog({
    userId: session!.user!.id,
    action: "update",
    resource: "project",
    resourceId: id,
    details: { subcontractId: subId },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const csrf = csrfGuard(_req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { id, subId } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  await db.subcontract.delete({ where: { id: subId } });

  return NextResponse.json({ success: true });
}
