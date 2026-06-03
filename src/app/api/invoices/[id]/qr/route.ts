import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";
import { generateInvoiceQR } from "@/lib/qr";
import { auditLog } from "@/lib/audit";

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
  const qrFailMsg = {
    ar: "فشل إنشاء رمز QR",
    en: "Failed to generate QR code",
  };
  const sellerNameFallback = {
    ar: "فاتورة",
    en: "Fatoora",
  };

  if (!(await checkRateLimit(`qr:${session.user.id}`, 30))) {
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

    await auditLog({
      userId: session.user.id, action: "download", resource: "invoice", resourceId: id,
    });

    const qrDataUrl = await generateInvoiceQR({
      sellerName: user?.companyName ?? user?.name ?? sellerNameFallback[lang],
      vatNumber: user?.taxNumber ?? "000000000000000",
      timestamp: invoice.date,
      total: Number(invoice.total),
      vatTotal: Number(invoice.taxAmount),
    });

    return NextResponse.json({ qrCode: qrDataUrl });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json({ error: qrFailMsg[lang] }, { status: 500 });
  }
}
