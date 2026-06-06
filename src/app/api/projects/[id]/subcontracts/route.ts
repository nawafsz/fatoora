import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  subcontractorId: z.string().min(1),
  scope: z.string().min(1),
  contractValue: z.number().positive(),
  retentionRate: z.number().min(0).max(100).default(10),
  advancePayment: z.number().min(0).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  if (!(await checkRateLimit(`subcontracts:list:${session!.user!.id}`, 60))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً" }, { status: 429 });
  }

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const subcontracts = await db.subcontract.findMany({
    where: { projectId: id },
    include: { subcontractor: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(subcontracts);
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

  if (!(await checkRateLimit(`subcontracts:create:${session!.user!.id}`, 20))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً" }, { status: 429 });
  }

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }

  const sub = await db.subcontract.create({
    data: {
      projectId: id,
      subcontractorId: parsed.data.subcontractorId,
      scope: parsed.data.scope,
      contractValue: parsed.data.contractValue,
      retentionRate: parsed.data.retentionRate,
      advancePayment: parsed.data.advancePayment,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      notes: parsed.data.notes ?? null,
    },
    include: { subcontractor: { select: { name: true } } },
  });

  await auditLog({
    userId: session!.user!.id,
    action: "create",
    resource: "project",
    resourceId: id,
    details: { subcontractId: sub.id, scope: sub.scope },
  });

  return NextResponse.json(sub);
}
