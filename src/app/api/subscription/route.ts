import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { auditLog } from "@/lib/audit";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const userId = session!.user!.id;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, invoicesLimit: true },
  });

  const subscription = await db.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      plan: true,
      status: true,
      paymentMethod: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      createdAt: true,
    },
  });

  const payments = await db.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      amount: true,
      status: true,
      provider: true,
      plan: true,
      description: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    plan: user?.plan ?? "free",
    invoicesLimit: user?.invoicesLimit ?? 5,
    subscription,
    payments,
  });
}

export async function DELETE() {
  const csrfCheck = csrfGuard(new Request("http://localhost"));
  if (csrfCheck) return csrfCheck;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const userId = session!.user!.id;

  const sub = await db.subscription.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "desc" },
  });

  if (!sub) {
    return NextResponse.json({ error: "لا يوجد اشتراك نشط للإلغاء" }, { status: 400 });
  }

  await db.subscription.update({
    where: { id: sub.id },
    data: { status: "canceled", canceledAt: new Date() },
  });

  await db.user.update({
    where: { id: userId },
    data: { plan: "free", invoicesLimit: 5 },
  });

  await auditLog({
    userId,
    action: "cancel_subscription",
    resource: "subscription",
    details: { previousPlan: sub.plan },
  });

  return NextResponse.json({ success: true });
}
