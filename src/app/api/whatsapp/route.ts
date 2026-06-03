import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { sendWhatsappSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  if (!(await checkRateLimit(`whatsapp:${session!.user!.id}`, 30))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً. حاول بعد دقيقة." }, { status: 429 });
  }

  if (!WHATSAPP_API_KEY || !WHATSAPP_PHONE_ID) {
    return NextResponse.json({ error: "واتساب غير مُهيّأ" }, { status: 500 });
  }

  const json = await req.json();
  const parsed = sendWhatsappSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "معرف الفاتورة مطلوب" }, { status: 400 });
  }

  const { invoiceId } = parsed.data;

  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, userId: session!.user!.id },
    include: { client: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
  }

  if (!invoice.client.phone) {
    return NextResponse.json({ error: "العميل ليس لديه رقم جوال" }, { status: 400 });
  }

  try {
    const user = await db.user.findUnique({ where: { id: session!.user!.id } });

    const messageText = `*فاتورة ضريبية - ${user?.companyName ?? "فاتورة"}*\n\nرقم الفاتورة: ${invoice.invoiceNumber}\nالتاريخ: ${invoice.date.toLocaleDateString("ar-SA")}\nالمجموع: ${Number(invoice.total).toFixed(2)} ر.س\nالضريبة: ${Number(invoice.taxAmount).toFixed(2)} ر.س\n\nرابط التحميل: ${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${invoice.id}/pdf\n\nشكراً لتعاملكم 🙏`;

    const res = await fetch(
      `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: invoice.client.phone.replace(/^0/, "966"),
          type: "text",
          text: { body: messageText },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("WhatsApp error:", err);
      return NextResponse.json({ error: "فشل إرسال رسالة واتساب" }, { status: 500 });
    }

    await auditLog({
      userId: session!.user!.id,
      action: "create",
      resource: "whatsapp",
      resourceId: invoiceId,
      details: { invoiceNumber: invoice.invoiceNumber, phone: invoice.client.phone.slice(-4) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WhatsApp error:", error);
    return NextResponse.json({ error: "فشل إرسال رسالة واتساب" }, { status: 500 });
  }
}
