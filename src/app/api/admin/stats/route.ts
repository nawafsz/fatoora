import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalUsers, totalInvoices, totalRevenue, planCounts] = await Promise.all([
    db.user.count(),
    db.invoice.count(),
    db.invoice.aggregate({ _sum: { total: true } }),
    db.user.groupBy({ by: ["plan"], _count: true }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalInvoices,
    totalRevenue: Number(totalRevenue._sum.total ?? 0),
    planCounts,
  });
}
