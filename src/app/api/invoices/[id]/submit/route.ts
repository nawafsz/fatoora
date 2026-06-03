import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { submitInvoice } from "@/lib/zatca";
import { generateInvoiceQR } from "@/lib/qr";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { auditLog } from "@/lib/audit";
import { decryptString } from "@/lib/encryption";

export async function POST(
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
  const incompleteSettingsMsg = {
    ar: "يرجى إكمال بيانات الشركة والرقم الضريبي في الإعدادات",
    en: "Please complete your company info and VAT number in settings",
  };
  const zatcaFailMsg = {
    ar: "فشل إرسال الفاتورة إلى ZATCA",
    en: "Failed to submit invoice to ZATCA",
  };

  if (!(await checkRateLimit(`invoices:submit:${session!.user!.id}`, 20))) {
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

  const user = await db.user.findUnique({
    where: { id: session!.user!.id },
  });

  if (!user?.companyName || !user?.taxNumber) {
    return NextResponse.json(
      { error: incompleteSettingsMsg[lang] },
      { status: 400 }
    );
  }

  try {
    const items = (Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items as string)) as Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;

    const zatcaRes = await submitInvoice({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.date.toISOString(),
      invoiceType: invoice.type,
      supplier: {
        name: user.companyName,
        taxNumber: user.taxNumber,
      },
      customer: {
        name: invoice.client.name.includes(":") ? decryptString(invoice.client.name) : invoice.client.name,
        taxNumber: invoice.client.taxNumber ?? undefined,
      },
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        taxExclusivePrice: i.unitPrice,
        unitPrice: i.unitPrice,
        taxAmount: i.unitPrice * i.quantity * 0.15,
        total: i.quantity * i.unitPrice,
      })),
      total: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      totalWithTax: Number(invoice.total),
    });

    const qrDataUrl = await generateInvoiceQR({
      sellerName: user.companyName,
      vatNumber: user.taxNumber,
      timestamp: invoice.date,
      total: Number(invoice.total),
      vatTotal: Number(invoice.taxAmount),
    });

    await db.invoice.update({
      where: { id },
      data: {
        status: "COMPLETED",
        zatcaStatus: zatcaRes.status,
        xmlUuid: zatcaRes.uuid,
        qrCode: qrDataUrl,
        zatcaResponse: zatcaRes as object,
      },
    });

    await auditLog({
      userId: session!.user!.id,
      action: "submit_zatca",
      resource: "invoice",
      resourceId: id,
      details: { invoiceNumber: invoice.invoiceNumber, uuid: zatcaRes.uuid },
    });

    return NextResponse.json({ success: true, uuid: zatcaRes.uuid });
  } catch (error) {
    console.error("ZATCA submission error:", error);
    return NextResponse.json(
      { error: zatcaFailMsg[lang] },
      { status: 500 }
    );
  }
}
