import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const createClaimSchema = z.object({
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  completionPct: z.number().min(0).max(100),
  grossAmount: z.number().positive(),
  retentionAmt: z.number().min(0),
  advanceDeduct: z.number().min(0),
  previousClaims: z.number().min(0),
  netCurrent: z.number().min(0),
  vatAmount: z.number().min(0),
  totalDue: z.number().min(0),
  notes: z.string().optional(),
  boqItems: z.array(z.object({
    boqItemId: z.string(),
    qtyThisClaim: z.number().min(0),
    qtyCumulative: z.number().min(0),
    pctComplete: z.number().min(0).max(100),
    amountClaimed: z.number().min(0),
  })).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  if (!(await checkRateLimit(`claims:list:${session!.user!.id}`, 60))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً" }, { status: 429 });
  }

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) {
    return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
  }

  const claims = await db.progressClaim.findMany({
    where: { projectId: id },
    include: { _count: { select: { boqSnapshots: true } } },
    orderBy: { claimNumber: "desc" },
  });

  return NextResponse.json(claims);
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

  if (!(await checkRateLimit(`claims:create:${session!.user!.id}`, 20))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً" }, { status: 429 });
  }

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) {
    return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
  }

  const json = await req.json();
  const parsed = createClaimSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }

  const lastClaim = await db.progressClaim.findFirst({
    where: { projectId: id },
    orderBy: { claimNumber: "desc" },
    select: { claimNumber: true },
  });

  const claimNumber = (lastClaim?.claimNumber ?? 0) + 1;

  const data: Record<string, unknown> = {
    claimNumber,
    projectId: id,
    periodStart: new Date(parsed.data.periodStart),
    periodEnd: new Date(parsed.data.periodEnd),
    completionPct: parsed.data.completionPct,
    grossAmount: parsed.data.grossAmount,
    retentionAmt: parsed.data.retentionAmt,
    advanceDeduct: parsed.data.advanceDeduct,
    previousClaims: parsed.data.previousClaims,
    netCurrent: parsed.data.netCurrent,
    vatAmount: parsed.data.vatAmount,
    totalDue: parsed.data.totalDue,
    notes: parsed.data.notes ?? null,
  };

  const claim = await db.progressClaim.create({
    data: data as any,
  });

  if (parsed.data.boqItems?.length) {
    await db.claimBOQItem.createMany({
      data: parsed.data.boqItems.map((item) => ({
        claimId: claim.id,
        boqItemId: item.boqItemId,
        qtyThisClaim: item.qtyThisClaim,
        qtyCumulative: item.qtyCumulative,
        pctComplete: item.pctComplete,
        amountClaimed: item.amountClaimed,
      })),
    });
  }

  await auditLog({
    userId: session!.user!.id,
    action: "create",
    resource: "project",
    resourceId: id,
    details: { claimNumber, totalDue: parsed.data.totalDue },
  });

  return NextResponse.json(claim);
}
