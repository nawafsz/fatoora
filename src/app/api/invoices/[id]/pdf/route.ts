import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";
import { renderInvoicePdf } from "@/lib/render-pdf";
import { auditLog } from "@/lib/audit";
import { decryptString } from "@/lib/encryption";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const settings = await db.settings.findUnique({
    where: { userId: session.user.id },
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
  const pdfFailMsg = {
    ar: "فشل إنشاء ملف PDF",
    en: "Failed to generate PDF",
  };
  const sellerNameFallback = {
    ar: "فاتورة",
    en: "Fatoora",
  };

  if (!(await checkRateLimit(`pdf:${session.user.id}`, 20))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const { id } = await params;

  try {
    const invoice = await db.invoice.findFirst({
      where: { id, userId: session.user.id },
      include: { client: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: invoiceNotFoundMsg[lang] }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    const items = (Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items as string)) as Array<{ name: string; quantity: number; unitPrice: number }>;

    const clientName = invoice.client.name.includes(":") ? decryptString(invoice.client.name) : invoice.client.name;

    const pdfBuffer = await renderInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date.toLocaleDateString(lang === "en" ? "en-US" : "ar-SA"),
      sellerName: user?.companyName ?? user?.name ?? sellerNameFallback[lang],
      sellerTaxNumber: user?.taxNumber ?? "—",
      clientName,
      clientTaxNumber: invoice.client.taxNumber ?? undefined,
      clientPhone: invoice.client.phone ?? undefined,
      items,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
    });

    await auditLog({
      userId: session.user.id, action: "download", resource: "invoice", resourceId: id,
      details: { invoiceNumber: invoice.invoiceNumber },
    });

    return new Response(new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }), {
      headers: {
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: pdfFailMsg[lang] }, { status: 500 });
  }
}
