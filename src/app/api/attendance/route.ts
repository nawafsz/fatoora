import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const json = await req.json();
  const { workerId, projectId, date, status, hoursExtra, notes } = json;

  if (!workerId || !projectId || !date || !status) {
    return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
  }

  const record = await db.attendanceRecord.upsert({
    where: {
      workerId_projectId_date: {
        workerId,
        projectId,
        date: new Date(date),
      },
    },
    update: { status, hoursExtra: hoursExtra ?? 0, notes: notes ?? null },
    create: {
      workerId,
      projectId,
      date: new Date(date),
      status,
      hoursExtra: hoursExtra ?? 0,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(record);
}

export async function GET(req: Request) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  const date = url.searchParams.get("date");

  if (!projectId || !date) {
    return NextResponse.json({ error: "projectId و date مطلوبان" }, { status: 400 });
  }

  const records = await db.attendanceRecord.findMany({
    where: {
      projectId,
      date: new Date(date),
    },
    include: { worker: { select: { id: true, name: true, jobTitle: true, dailyRate: true } } },
  });

  return NextResponse.json(records);
}
