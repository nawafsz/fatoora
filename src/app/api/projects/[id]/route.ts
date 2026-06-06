import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  clientId: z.string().min(1).optional(),
  contractValue: z.number().positive().optional(),
  advancePayment: z.number().min(0).optional(),
  retentionRate: z.number().min(0).max(100).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const settings = await db.settings.findUnique({
    where: { userId: session!.user!.id },
    select: { language: true },
  });
  const lang = (settings?.language ?? "ar") as "ar" | "en";

  if (!(await checkRateLimit(`projects:get:${session!.user!.id}`, 60))) {
    return NextResponse.json({
      error: lang === "en" ? "Too many requests" : "طلبات كثيرة جداً",
    }, { status: 429 });
  }

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
    include: {
      client: { select: { id: true, name: true, taxNumber: true } },
      _count: {
        select: {
          progressClaims: true,
          subcontracts: true,
          boqItems: true,
        },
      },
      progressClaims: {
        select: { totalDue: true, status: true, claimNumber: true, completionPct: true },
        orderBy: { claimNumber: "desc" },
      },
      subcontracts: {
        select: { id: true, scope: true, contractValue: true, status: true },
      },
    },
  });

  if (!project) {
    return NextResponse.json({
      error: lang === "en" ? "Project not found" : "المشروع غير موجود",
    }, { status: 404 });
  }

  const totalClaimed = project.progressClaims.reduce(
    (sum, c) => sum + Number(c.totalDue), 0
  );
  const totalPaid = project.progressClaims
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + Number(c.totalDue), 0);
  const completionPct =
    Number(project.contractValue) > 0
      ? Math.min((totalClaimed / Number(project.contractValue)) * 100, 100)
      : 0;

  await auditLog({
    userId: session!.user!.id, action: "read", resource: "project", resourceId: id,
  });

  return NextResponse.json({
    ...project,
    totalClaimed,
    totalPaid,
    completionPct: Math.round(completionPct * 10) / 10,
  });
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

  const settings = await db.settings.findUnique({
    where: { userId: session!.user!.id },
    select: { language: true },
  });
  const lang = (settings?.language ?? "ar") as "ar" | "en";

  if (!(await checkRateLimit(`projects:update:${session!.user!.id}`, 20))) {
    return NextResponse.json({
      error: lang === "en" ? "Too many requests" : "طلبات كثيرة جداً",
    }, { status: 429 });
  }

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });

  if (!project) {
    return NextResponse.json({
      error: lang === "en" ? "Project not found" : "المشروع غير موجود",
    }, { status: 404 });
  }

  const json = await req.json();
  const parsed = updateProjectSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({
      error: parsed.error.issues[0]?.message ?? (lang === "en" ? "Invalid data" : "بيانات غير صحيحة"),
    }, { status: 400 });
  }

  const {
    name, code, description, location, clientId,
    contractValue, advancePayment, retentionRate, taxRate,
    startDate, endDate, status, notes,
  } = parsed.data;

  if (clientId) {
    const client = await db.client.findFirst({
      where: { id: clientId, userId: session!.user!.id },
    });
    if (!client) {
      return NextResponse.json({
        error: lang === "en" ? "Client not found" : "العميل غير موجود",
      }, { status: 404 });
    }
  }

  const updated = await db.project.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code }),
      ...(description !== undefined && { description }),
      ...(location !== undefined && { location }),
      ...(clientId !== undefined && { clientId }),
      ...(contractValue !== undefined && { contractValue }),
      ...(advancePayment !== undefined && { advancePayment }),
      ...(retentionRate !== undefined && { retentionRate }),
      ...(taxRate !== undefined && { taxRate }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      client: { select: { id: true, name: true } },
    },
  });

  await auditLog({
    userId: session!.user!.id,
    action: "update",
    resource: "project",
    resourceId: id,
    details: { name: updated.name },
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

  const settings = await db.settings.findUnique({
    where: { userId: session!.user!.id },
    select: { language: true },
  });
  const lang = (settings?.language ?? "ar") as "ar" | "en";

  if (!(await checkRateLimit(`projects:delete:${session!.user!.id}`, 10))) {
    return NextResponse.json({
      error: lang === "en" ? "Too many requests" : "طلبات كثيرة جداً",
    }, { status: 429 });
  }

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });

  if (!project) {
    return NextResponse.json({
      error: lang === "en" ? "Project not found" : "المشروع غير موجود",
    }, { status: 404 });
  }

  await db.project.delete({ where: { id } });

  await auditLog({
    userId: session!.user!.id,
    action: "delete",
    resource: "project",
    resourceId: id,
  });

  return NextResponse.json({ success: true });
}
