import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";
import { auditLog } from "@/lib/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  if (!(await checkRateLimit(`client-invoices:${session.user.id}`, 60))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً. حاول بعد دقيقة." }, { status: 429 });
  }

  const { id } = await params;

  const client = await db.client.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!client) {
    return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
  }

  const invoices = await db.invoice.findMany({
    where: { clientId: id, userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  await auditLog({
    userId: session.user.id, action: "read", resource: "client",
    resourceId: id, details: { invoicesCount: invoices.length },
  });

  return NextResponse.json({ client, invoices });
}
