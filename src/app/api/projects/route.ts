import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(2),
  code: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  clientId: z.string().min(1),
  contractValue: z.number().positive(),
  advancePayment: z.number().min(0).default(0),
  retentionRate: z.number().min(0).max(100).default(10),
  taxRate: z.number().min(0).max(100).default(15),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(_req: Request) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const projects = await db.project.findMany({
    where: { userId: session!.user!.id },
    include: {
      client: { select: { id: true, name: true } },
      _count: {
        select: {
          progressClaims: true,
          subcontracts: true,
        },
      },
      progressClaims: {
        select: { totalDue: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // احسب الإجماليات لكل مشروع
  const projectsWithStats = projects.map((p) => {
    const totalClaimed = p.progressClaims.reduce(
      (sum, c) => sum + Number(c.totalDue),
      0
    );
    const totalPaid = p.progressClaims
      .filter((c) => c.status === "PAID")
      .reduce((sum, c) => sum + Number(c.totalDue), 0);
    const completionPct =
      Number(p.contractValue) > 0
        ? Math.min((totalClaimed / Number(p.contractValue)) * 100, 100)
        : 0;

    return {
      ...p,
      totalClaimed,
      totalPaid,
      completionPct: Math.round(completionPct * 10) / 10,
    };
  });

  return NextResponse.json(projectsWithStats);
}

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const json = await req.json();
  const parsed = createProjectSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const {
    name, code, description, location, clientId,
    contractValue, advancePayment, retentionRate, taxRate,
    startDate, endDate, notes,
  } = parsed.data;

  // تأكد أن العميل يتبع هذا المستخدم
  const client = await db.client.findFirst({
    where: { id: clientId, userId: session!.user!.id },
  });
  if (!client) {
    return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
  }

  const project = await db.project.create({
    data: {
      name,
      code,
      description,
      location,
      clientId,
      contractValue,
      advancePayment,
      retentionRate,
      taxRate,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      notes,
      userId: session!.user!.id,
    },
    include: {
      client: { select: { id: true, name: true } },
    },
  });

  await auditLog({
    userId: session!.user!.id,
    action: "create",
    resource: "project",
    resourceId: project.id,
    details: { name, contractValue },
  });

  return NextResponse.json(project);
}
