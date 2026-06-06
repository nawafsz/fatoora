import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  code: z.string().optional(),
  description: z.string().min(1),
  unit: z.string().default("م2"),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  category: z.string().optional(),
  sortOrder: z.number().default(0),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  if (!(await checkRateLimit(`boq:list:${session!.user!.id}`, 60))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً" }, { status: 429 });
  }

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const items = await db.bOQItem.findMany({
    where: { projectId: id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  if (!(await checkRateLimit(`boq:create:${session!.user!.id}`, 30))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً" }, { status: 429 });
  }

  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session!.user!.id },
  });
  if (!project) return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }

  const totalPrice = parsed.data.quantity * parsed.data.unitPrice;

  const item = await db.bOQItem.create({
    data: {
      projectId: id,
      code: parsed.data.code ?? null,
      description: parsed.data.description,
      unit: parsed.data.unit,
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.unitPrice,
      totalPrice,
      category: parsed.data.category ?? null,
      sortOrder: parsed.data.sortOrder,
    },
  });

  await auditLog({
    userId: session!.user!.id,
    action: "create",
    resource: "project",
    resourceId: id,
    details: { boqItemId: item.id, description: item.description },
  });

  return NextResponse.json(item);
}
