import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { authoriseOrder, getOrderDetails } from "@/lib/tamara";

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
  if (!process.env.TAMARA_API_TOKEN) {
    return NextResponse.json({ error: "Tamara غير مُهيّأ" }, { status: 500 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "tamara";

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "فشل قراءة الطلب" }, { status: 400 });
  }

  const eventType = body.event_type as string;
  const orderId = body.order_id as string;

  await auditLog({
    action: "webhook_received",
    resource: "webhook",
    details: { type: eventType, orderId, provider: "tamara" },
    ip,
  });

  switch (eventType) {
    case "order_approved": {
      if (!orderId) break;

      try {
        // authorise the order
        await authoriseOrder(orderId);

        // get order details to extract plan info
        const orderDetails = await getOrderDetails(orderId);
        const orderRef = orderDetails.order_reference_id ?? "";
        // format: sub-{userId}-{plan}-{timestamp}
        const refParts = orderRef.split("-");
        const userId = refParts[1];
        const plan = refParts[2];

        if (userId && plan) {
          await upgradeUser(userId, plan);

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
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              },
            });
          }

          await db.payment.create({
            data: {
              userId,
              subscriptionId: sub?.id ?? null,
              amount: 0, // will be updated if we have the amount
              currency: "SAR",
              status: "paid",
              provider: "tamara",
              providerPaymentId: orderId,
              plan,
              description: `اشتراك ${plan} عبر Tamara`,
            },
          });

          await auditLog({
            userId,
            action: "subscription_updated",
            resource: "subscription",
            details: { plan, event: eventType, provider: "tamara" },
            ip,
          });
        }
      } catch (e) {
        console.error("Tamara webhook: failed to process order_approved", e);
      }
      break;
    }

    case "order_declined":
    case "order_cancelled": {
      if (body.metadata_user_id) {
        await db.subscription.updateMany({
          where: { userId: body.metadata_user_id as string, status: "incomplete" },
          data: { status: "canceled" },
        });

        await auditLog({
          userId: body.metadata_user_id as string,
          action: "subscription_cancelled",
          resource: "subscription",
          details: { event: eventType, orderId, provider: "tamara" },
          ip,
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
