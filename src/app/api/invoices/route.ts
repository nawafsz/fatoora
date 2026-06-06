import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateInvoiceNumber, getPlanLimits, checkRateLimit } from "@/lib/utils";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { createInvoiceSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

export async function GET(_req: Request) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const settings = await db.settings.findUnique({
    where: { userId: session!.user!.id },
    select: { language: true },
  });
  const lang = (settings?.language ?? "ar") as "ar" | "en";
  const rateLimitMsg: Record<string, string> = {
    ar: "طلبات كثيرة جداً. حاول بعد دقيقة.",
    en: "Too many requests. Please try again in a minute.",
  };

  if (!(await checkRateLimit(`invoices:list:${session!.user!.id}`, 60))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const invoices = await db.invoice.findMany({
    where: { userId: session!.user!.id },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  await auditLog({
    userId: session!.user!.id, action: "read", resource: "invoice",
    details: { count: invoices.length },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const settings = await db.settings.findUnique({
    where: { userId: session!.user!.id },
  });
  const lang = (settings?.language ?? "ar") as "ar" | "en";
  const rateLimitMsg = {
    ar: "طلبات كثيرة جداً. حاول بعد دقيقة.",
    en: "Too many requests. Please try again in a minute.",
  };
  const invalidInvoiceDataMsg = {
    ar: "بيانات الفاتورة غير صحيحة",
    en: "Invalid invoice data",
  };
  const userNotFoundMsg = {
    ar: "المستخدم غير موجود",
    en: "User not found",
  };

  if (!(await checkRateLimit(`invoices:create:${session!.user!.id}`, 30))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const json = await req.json();
  const parsed = createInvoiceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? invalidInvoiceDataMsg[lang] }, { status: 400 });
  }

  const { clientId, type, date, dueDate, items, notes, projectId } = parsed.data;

  const user = await db.user.findUnique({
    where: { id: session!.user!.id },
    select: { plan: true, invoicesLimit: true },
  });

  if (!user) return NextResponse.json({ error: userNotFoundMsg[lang] }, { status: 404 });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthCount = await db.invoice.count({
    where: { userId: session!.user!.id, createdAt: { gte: monthStart } },
  });

  if (monthCount >= user.invoicesLimit) {
    const monthlyLimitMsg = {
      ar: `لقد تجاوزت حد الفواتير الشهري (${getPlanLimits(user.plan).invoicesPerMonth} فاتورة)`,
      en: `You have exceeded your monthly invoice limit (${getPlanLimits(user.plan).invoicesPerMonth} invoices)`,
    };
    return NextResponse.json(
      { error: monthlyLimitMsg[lang] },
      { status: 403 }
    );
  }

  const prefix = settings?.invoicePrefix ?? "INV-";
  const nextNum = settings?.nextNumber ?? 1;

  const invoiceNumber = generateInvoiceNumber(prefix, nextNum);

  const calculatedSubtotal = (items as Array<{ quantity: number; unitPrice: number }>).reduce(
    (sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0
  );
  const calculatedTax = Math.round(calculatedSubtotal * (Number(settings?.defaultTaxRate ?? 15) / 100) * 100) / 100;
  const calculatedTotal = Math.round((calculatedSubtotal + calculatedTax) * 100) / 100;

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      type: type ?? "CASH",
      date: date ? new Date(date) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      items,
      subtotal: calculatedSubtotal,
      discount: 0,
      taxAmount: calculatedTax,
      total: calculatedTotal,
      notes,
      userId: session!.user!.id,
      clientId,
      projectId: projectId ?? null,
    },
    include: { client: true },
  });

  await db.settings.upsert({
    where: { userId: session!.user!.id },
    update: { nextNumber: nextNum + 1 },
    create: { userId: session!.user!.id, nextNumber: nextNum + 1 },
  });

  await auditLog({
    userId: session!.user!.id,
    action: "create",
    resource: "invoice",
    resourceId: invoice.id,
    details: { invoiceNumber, total: calculatedTotal },
  });

  return NextResponse.json(invoice);
}
