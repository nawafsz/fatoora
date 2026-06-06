import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { auditLog } from "@/lib/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { id } = await params;

  const worker = await db.worker.findFirst({
    where: { id, userId: session!.user!.id },
    include: {
      assignments: {
        include: { project: { select: { id: true, name: true } } },
      },
      attendance: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
  });
  if (!worker) return NextResponse.json({ error: "العامل غير موجود" }, { status: 404 });

  return NextResponse.json(worker);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { id } = await params;

  const worker = await db.worker.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!worker) return NextResponse.json({ error: "العامل غير موجود" }, { status: 404 });

  const json = await req.json();
  const allowed = ["name", "iqamaNumber", "iqamaExpiry", "nationality", "jobTitle", "phone", "dailyRate", "active", "notes"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (json[key] !== undefined) {
      data[key] = key === "iqamaExpiry" ? (json[key] ? new Date(json[key]) : null) : json[key];
    }
  }

  const updated = await db.worker.update({
    where: { id },
    data: data as any,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfGuard(_req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { id } = await params;

  const worker = await db.worker.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!worker) return NextResponse.json({ error: "العامل غير موجود" }, { status: 404 });

  await db.worker.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
