import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { createInvoice, getPlanPrice, isConfigured } from "@/lib/moyasar";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const userId = session!.user!.id;

  if (!(await checkRateLimit(`checkout:${userId}`, 5))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً. حاول بعد دقيقة." }, { status: 429 });
  }

  if (!isConfigured()) {
    return NextResponse.json({ error: "Moyasar غير مُهيّأ" }, { status: 500 });
  }

  const json = await req.json();
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "باقة غير صحيحة" }, { status: 400 });
  }

  const { plan } = parsed.data;
  const selected = getPlanPrice(plan);
  if (!selected) {
    return NextResponse.json({ error: "باقة غير صحيحة" }, { status: 400 });
  }

  try {
    const invoice = await createInvoice({
      amount: selected.amount,
      description: selected.name,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
      metadata: { userId, plan },
    });

    const existing = await db.subscription.findFirst({
      where: { userId, status: { in: ["active", "incomplete"] } },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await db.subscription.update({
        where: { id: existing.id },
        data: { plan, status: "incomplete", updatedAt: new Date() },
      });
    } else {
      await db.subscription.create({
        data: { userId, plan, status: "incomplete", paymentMethod: "moyasar" },
      });
    }

    await auditLog({
      userId,
      action: "create",
      resource: "subscription",
      details: { plan, moyasarInvoiceId: invoice.id },
    });

    return NextResponse.json({ url: invoice.invoiceUrl });
  } catch (error) {
    console.error("Moyasar error:", error);
    return NextResponse.json({ error: "فشل إنشاء فاتورة الدفع" }, { status: 500 });
  }
}
