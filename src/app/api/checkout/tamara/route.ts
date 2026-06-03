import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { auditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { checkoutSchema } from "@/lib/validation";
import { createCheckoutSession, isConfigured } from "@/lib/tamara";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const userId = session!.user!.id;
  const user = session!.user!;

  if (!(await checkRateLimit(`checkout:tamara:${userId}`, 3))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً. حاول بعد دقيقة." }, { status: 429 });
  }

  if (!isConfigured()) {
    return NextResponse.json({ error: "Tamara غير مُهيّأ" }, { status: 500 });
  }

  const json = await req.json();
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "باقة غير صحيحة" }, { status: 400 });
  }

  const { plan } = parsed.data;

  const prices: Record<string, { price: number; name: string; invoices: number }> = {
    starter: { price: 49, name: "باقة البداية", invoices: 100 },
    pro: { price: 99, name: "باقة المحترف", invoices: 1000 },
    premium: { price: 199, name: "باقة الممتاز", invoices: Infinity },
  };

  const selected = prices[plan];
  if (!selected) {
    return NextResponse.json({ error: "باقة غير صحيحة" }, { status: 400 });
  }

  // for Tamara we charge annually (12 months)
  const annualAmount = selected.price * 12;

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const orderReferenceId = `sub-${userId}-${plan}-${Date.now()}`;

    const checkout = await createCheckoutSession({
      orderReferenceId,
      totalAmount: annualAmount * 100, // convert to halalas
      consumer: {
        first_name: user.name?.split(" ")[0] ?? "",
        last_name: user.name?.split(" ").slice(1).join(" ") ?? "",
        phone_number: user.phone ?? "0500000000",
        email: user.email ?? "",
      },
      items: [
        {
          name: selected.name,
          type: "SUBSCRIPTION",
          reference_id: plan,
          quantity: 1,
          unit_price: { amount: annualAmount * 100, currency: "SAR" },
          total_price: { amount: annualAmount * 100, currency: "SAR" },
        },
      ],
      merchantUrls: {
        success: `${appUrl}/dashboard/billing?success=true&provider=tamara`,
        failure: `${appUrl}/dashboard/billing?canceled=true`,
        cancel: `${appUrl}/dashboard/billing`,
        notification: `${appUrl}/api/webhooks/tamara`,
      },
      description: `فاتورة - ${selected.name} (سنوي)`,
    });

    const existing = await db.subscription.findFirst({
      where: { userId, status: { in: ["active", "incomplete"] } },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      await db.subscription.update({
        where: { id: existing.id },
        data: { plan, status: "incomplete", paymentMethod: "tamara" },
      });
    } else {
      await db.subscription.create({
        data: { userId, plan, status: "incomplete", paymentMethod: "tamara" },
      });
    }

    await auditLog({
      userId,
      action: "create",
      resource: "subscription",
      details: { plan, provider: "tamara", tamaraOrderId: checkout.order_id },
    });

    return NextResponse.json({ url: checkout.checkout_url });
  } catch (error) {
    console.error("Tamara error:", error);
    return NextResponse.json({ error: "فشل إنشاء جلسة الدفع مع Tamara" }, { status: 500 });
  }
}
