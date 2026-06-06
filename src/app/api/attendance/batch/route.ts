import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const json = await req.json();
  const { projectId, date, records } = json;

  if (!projectId || !date || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
  }

  const result = [];
  for (const r of records) {
    if (!r.workerId || !r.status) continue;
    const record = await db.attendanceRecord.upsert({
      where: {
        workerId_projectId_date: {
          workerId: r.workerId,
          projectId,
          date: new Date(date),
        },
      },
      update: { status: r.status, hoursExtra: r.hoursExtra ?? 0, notes: r.notes ?? null },
      create: {
        workerId: r.workerId,
        projectId,
        date: new Date(date),
        status: r.status,
        hoursExtra: r.hoursExtra ?? 0,
        notes: r.notes ?? null,
      },
    });
    result.push(record);
  }

  return NextResponse.json({ count: result.length, records: result });
}
