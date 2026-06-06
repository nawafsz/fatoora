import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const assignments = await db.projectWorker.findMany({
    where: { projectId: id, active: true },
    include: { worker: { select: { id: true, name: true, jobTitle: true, dailyRate: true, iqamaNumber: true } } },
  });

  return NextResponse.json(assignments);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const json = await req.json();
  const { workerId, dailyRate, active } = json;

  if (!workerId) return NextResponse.json({ error: "العامل مطلوب" }, { status: 400 });

  if (active === false) {
    await db.projectWorker.updateMany({
      where: { projectId: id, workerId },
      data: { active: false },
    });
    return NextResponse.json({ success: true });
  }

  const assignment = await db.projectWorker.upsert({
    where: { projectId_workerId: { projectId: id, workerId } },
    update: { dailyRate: dailyRate ?? null, active: true },
    create: { projectId: id, workerId, dailyRate: dailyRate ?? null },
  });

  return NextResponse.json(assignment);
}
