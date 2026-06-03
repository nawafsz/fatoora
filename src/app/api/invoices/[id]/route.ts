import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { updateInvoiceSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

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
  const rateLimitMsg = {
    ar: "طلبات كثيرة جداً. حاول بعد دقيقة.",
    en: "Too many requests. Please try again in a minute.",
  };
  const invoiceNotFoundMsg = {
    ar: "الفاتورة غير موجودة",
    en: "Invoice not found",
  };

  if (!(await checkRateLimit(`invoices:get:${session!.user!.id}`, 60))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const { id } = await params;

  const invoice = await db.invoice.findFirst({
    where: { id, userId: session!.user!.id },
    include: { client: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: invoiceNotFoundMsg[lang] }, { status: 404 });
  }

  await auditLog({
    userId: session!.user!.id, action: "read", resource: "invoice",
    resourceId: id, details: { invoiceNumber: invoice.invoiceNumber },
  });

  return NextResponse.json(invoice);
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
  const rateLimitMsg = {
    ar: "طلبات كثيرة جداً. حاول بعد دقيقة.",
    en: "Too many requests. Please try again in a minute.",
  };
  const invoiceNotFoundMsg = {
    ar: "الفاتورة غير موجودة",
    en: "Invoice not found",
  };
  const cannotEditMsg = {
    ar: "لا يمكن تعديل فاتورة تم إرسالها",
    en: "Cannot edit a submitted invoice",
  };
  const invalidDataMsg = {
    ar: "بيانات غير صحيحة",
    en: "Invalid data",
  };

  if (!(await checkRateLimit(`invoices:update:${session!.user!.id}`, 30))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const { id } = await params;

  const invoice = await db.invoice.findFirst({
    where: { id, userId: session!.user!.id },
  });

  if (!invoice) {
    return NextResponse.json({ error: invoiceNotFoundMsg[lang] }, { status: 404 });
  }

  const json = await req.json();

  if (invoice.status !== "DRAFT") {
    return NextResponse.json({ error: cannotEditMsg[lang] }, { status: 400 });
  }

  const parsed = updateInvoiceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? invalidDataMsg[lang] }, { status: 400 });
  }

  const { clientId, type, date, dueDate, items, notes } = parsed.data;

  const data: Record<string, unknown> = {};
  if (clientId) data.clientId = clientId;
  if (type) data.type = type;
  if (date) data.date = new Date(date);
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (items) {
    data.items = items;
    const calculatedSubtotal = (items as Array<{ quantity: number; unitPrice: number }>).reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) => sum + (item.quantity * item.unitPrice), 0
    );
    const settings = await db.settings.findUnique({ where: { userId: session!.user!.id } });
    const calculatedTax = Math.round(calculatedSubtotal * (Number(settings?.defaultTaxRate ?? 15) / 100) * 100) / 100;
    const calculatedTotal = Math.round((calculatedSubtotal + calculatedTax) * 100) / 100;
    data.subtotal = calculatedSubtotal;
    data.taxAmount = calculatedTax;
    data.total = calculatedTotal;
    data.discount = 0;
  }
  if (notes !== undefined) data.notes = notes;

  const updated = await db.invoice.update({
    where: { id },
    data,
    include: { client: true },
  });

  await auditLog({
    userId: session!.user!.id,
    action: "update",
    resource: "invoice",
    resourceId: id,
    details: { invoiceNumber: invoice.invoiceNumber },
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
  const rateLimitMsg = {
    ar: "طلبات كثيرة جداً. حاول بعد دقيقة.",
    en: "Too many requests. Please try again in a minute.",
  };
  const invoiceNotFoundMsg = {
    ar: "الفاتورة غير موجودة",
    en: "Invoice not found",
  };
  const deleteDraftOnlyMsg = {
    ar: "يمكن حذف الفواتير المسودة فقط",
    en: "Only draft invoices can be deleted",
  };

  if (!(await checkRateLimit(`invoices:delete:${session!.user!.id}`, 10))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const { id } = await params;

  const invoice = await db.invoice.findFirst({
    where: { id, userId: session!.user!.id },
  });

  if (!invoice) {
    return NextResponse.json({ error: invoiceNotFoundMsg[lang] }, { status: 404 });
  }

  if (invoice.status !== "DRAFT") {
    return NextResponse.json({ error: deleteDraftOnlyMsg[lang] }, { status: 400 });
  }

  await db.invoice.delete({ where: { id } });

  await auditLog({
    userId: session!.user!.id,
    action: "delete",
    resource: "invoice",
    resourceId: id,
    details: { invoiceNumber: invoice.invoiceNumber },
  });

  return NextResponse.json({ success: true });
}
