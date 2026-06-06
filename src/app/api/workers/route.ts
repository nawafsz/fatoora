import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  iqamaNumber: z.string().optional(),
  iqamaExpiry: z.string().optional(),
  nationality: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  dailyRate: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function GET(_req: Request) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  if (!(await checkRateLimit(`workers:list:${session!.user!.id}`, 60))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً" }, { status: 429 });
  }

  const workers = await db.worker.findMany({
    where: { userId: session!.user!.id },
    include: {
      _count: { select: { assignments: true, attendance: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workers);
}

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  if (!(await checkRateLimit(`workers:create:${session!.user!.id}`, 20))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً" }, { status: 429 });
  }

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }

  const worker = await db.worker.create({
    data: {
      name: parsed.data.name,
      iqamaNumber: parsed.data.iqamaNumber ?? null,
      iqamaExpiry: parsed.data.iqamaExpiry ? new Date(parsed.data.iqamaExpiry) : null,
      nationality: parsed.data.nationality ?? null,
      jobTitle: parsed.data.jobTitle ?? null,
      phone: parsed.data.phone ?? null,
      dailyRate: parsed.data.dailyRate,
      notes: parsed.data.notes ?? null,
      userId: session!.user!.id,
    },
  });

  await auditLog({
    userId: session!.user!.id,
    action: "create",
    resource: "project",
    resourceId: worker.id,
    details: { name: worker.name },
  });

  return NextResponse.json(worker);
}
