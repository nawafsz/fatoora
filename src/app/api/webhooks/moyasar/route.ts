import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { getPayment } from "@/lib/moyasar";

const PLAN_MAP: Record<string, { plan: string; invoicesLimit: number }> = {
  starter: { plan: "starter", invoicesLimit: 100 },
  pro: { plan: "pro", invoicesLimit: 1000 },
  premium: { plan: "premium", invoicesLimit: Infinity },
};

async function upgradeUser(userId: string, plan: string) {
  const cfg = PLAN_MAP[plan];
  if (!cfg) return;
  await db.user.update({
    where: { id: userId },
    data: { plan: cfg.plan, invoicesLimit: cfg.invoicesLimit },
  });
}

export async function POST(req: Request) {
  if (!process.env.MOYASAR_SECRET_KEY) {
    return NextResponse.json({ error: "Moyasar غير مُهيّأ" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "فشل قراءة الطلب" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const eventType = payload.type as string;
  const data = payload.data as Record<string, unknown> | undefined;
  const ip = req.headers.get("x-forwarded-for") ?? "moyasar";

  // handle both direct payment payload and nested data object
  const paymentId = (data?.id as string) ?? (payload.id as string);
  const metadata = (data?.metadata as Record<string, unknown> ?? payload.metadata ?? {}) as Record<string, unknown>;
  const amount = (data?.amount as number) ?? (payload.amount as number);

  switch (eventType) {
    case "payment.succeeded":
    case "payment.paid":
    case "invoice.paid": {
      if (!paymentId) break;

      let userId = metadata.userId as string;
      let plan = metadata.plan as string;

      // if metadata doesn't have userId/plan, fetch payment details
      if (!userId || !plan) {
        try {
          const payment = await getPayment(paymentId);
          userId = (payment.metadata?.userId as string) ?? "";
          plan = (payment.metadata?.plan as string) ?? "";
        } catch (e) {
          console.error("Moyasar webhook: failed to fetch payment", e);
          break;
        }
      }

      if (userId && plan) {
        await upgradeUser(userId, plan);

        // update subscription status
        const sub = await db.subscription.findFirst({
          where: { userId, status: "incomplete" },
          orderBy: { createdAt: "desc" },
        });
        if (sub) {
          await db.subscription.update({
            where: { id: sub.id },
            data: {
              status: "active",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }

        // create payment record
        await db.payment.create({
          data: {
            userId,
            subscriptionId: sub?.id ?? null,
            amount: amount ? Number(amount) / 100 : 0,
            currency: "SAR",
            status: "paid",
            provider: "moyasar",
            providerPaymentId: paymentId,
            plan,
            description: `اشتراك باقة ${plan}`,
          },
        });

        await auditLog({
          userId, action: "subscription_updated", resource: "subscription",
          details: { plan, event: eventType }, ip,
        });
      }
      break;
    }

    case "payment.failed": {
      if (metadata.userId) {
        await auditLog({
          userId: metadata.userId as string,
          action: "subscription_updated",
          resource: "subscription",
          details: { event: "payment_failed", paymentId },
          ip,
        });
      }
      break;
    }
  }

  await auditLog({
    action: "webhook_received", resource: "webhook",
    details: { type: eventType, paymentId, provider: "moyasar" }, ip,
  });

  return NextResponse.json({ received: true });
}
