import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { auditLog } from "@/lib/audit";

export async function POST(
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
    include: { user: true },
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

  const settings = await db.settings.findUnique({
    where: { userId: session!.user!.id },
  });
  if (!settings) {
    return NextResponse.json({ error: "الرجاء إكمال الإعدادات أولاً" }, { status: 400 });
  }

  const client = await db.client.findUnique({
    where: { id: project.clientId },
  });
  if (!client) {
    return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
  }

  const invoicePrefix = settings.invoicePrefix ?? "INV-";
  const nextNum = settings.nextNumber ?? 1;
  const invoiceNumber = `${invoicePrefix}${String(nextNum).padStart(5, "0")}`;

  const itemName = `مستخلص رقم ${claim.claimNumber} — ${project.name}`;

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      type: "CREDIT",
      status: "DRAFT",
      date: new Date(),
      items: [{ name: itemName, quantity: 1, unitPrice: Number(claim.totalDue), taxExclusivePrice: Number(claim.netCurrent), taxAmount: Number(claim.vatAmount), total: Number(claim.totalDue) }],
      subtotal: Number(claim.netCurrent),
      discount: 0,
      taxAmount: Number(claim.vatAmount),
      total: Number(claim.totalDue),
      notes: claim.notes ?? `مستخلص رقم ${claim.claimNumber} — نسبة الإنجاز ${claim.completionPct}%`,
      userId: session!.user!.id,
      clientId: project.clientId,
      projectId: id,
    },
  });

  await db.progressClaim.update({
    where: { id: claimId },
    data: { invoiceId: invoice.id, status: "SUBMITTED" },
  });

  await db.settings.update({
    where: { userId: session!.user!.id },
    data: { nextNumber: nextNum + 1 },
  });

  await auditLog({
    userId: session!.user!.id,
    action: "create",
    resource: "invoice",
    resourceId: invoice.id,
    details: { invoiceNumber, claimNumber: claim.claimNumber, total: Number(claim.totalDue) },
  });

  return NextResponse.json({ claim, invoice });
}
