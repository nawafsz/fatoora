import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { auditLog } from "@/lib/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; claimId: string }> }
) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { id, claimId } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) {
    return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
  }

  const claim = await db.progressClaim.findFirst({
    where: { id: claimId, projectId: id },
    include: {
      boqSnapshots: {
        include: { boqItem: true },
      },
      invoice: true,
    },
  });

  if (!claim) {
    return NextResponse.json({ error: "المستخلص غير موجود" }, { status: 404 });
  }

  return NextResponse.json(claim);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; claimId: string }> }
) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { id, claimId } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) {
    return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
  }

  const claim = await db.progressClaim.findFirst({
    where: { id: claimId, projectId: id },
  });
  if (!claim) {
    return NextResponse.json({ error: "المستخلص غير موجود" }, { status: 404 });
  }

  const json = await req.json();

  const allowed = [
    "completionPct", "grossAmount", "retentionAmt", "advanceDeduct",
    "previousClaims", "netCurrent", "vatAmount", "totalDue",
    "status", "notes",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (json[key] !== undefined) {
      data[key] = json[key];
    }
  }

  const updated = await db.progressClaim.update({
    where: { id: claimId },
    data: data as any,
  });

  await auditLog({
    userId: session!.user!.id,
    action: "update",
    resource: "project",
    resourceId: id,
    details: { claimNumber: claim.claimNumber },
  });

  return NextResponse.json(updated);
}
