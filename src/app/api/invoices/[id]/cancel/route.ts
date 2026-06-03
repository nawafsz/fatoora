import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cancelInvoice } from "@/lib/zatca";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { auditLog } from "@/lib/audit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfGuard(_req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  if (!(await checkRateLimit(`invoices:cancel:${session!.user!.id}`, 10))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً. حاول بعد دقيقة." }, { status: 429 });
  }

  const { id } = await params;

  const invoice = await db.invoice.findFirst({
    where: { id, userId: session!.user!.id },
  });

  if (!invoice) {
    return NextResponse.json({ error: "الفاتورة غير موجودة" }, { status: 404 });
  }

  if (invoice.status === "CANCELLED") {
    return NextResponse.json({ error: "الفاتورة ملغية بالفعل" }, { status: 400 });
  }

  if (invoice.status === "DRAFT") {
    await db.invoice.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await auditLog({
      userId: session!.user!.id,
      action: "cancel_zatca",
      resource: "invoice",
      resourceId: id,
      details: { invoiceNumber: invoice.invoiceNumber, reason: "draft_cancel" },
    });

    return NextResponse.json({ success: true });
  }

  try {
    const uuid = invoice.xmlUuid ?? "";
    await cancelInvoice(uuid);

    await db.invoice.update({
      where: { id },
      data: {
        status: "CANCELLED",
        zatcaStatus: "cancelled",
      },
    });

    await auditLog({
      userId: session!.user!.id,
      action: "cancel_zatca",
      resource: "invoice",
      resourceId: id,
      details: { invoiceNumber: invoice.invoiceNumber, uuid },
    });

    return NextResponse.json({ success: true, uuid });
  } catch {
    return NextResponse.json(
      { error: "فشل إلغاء الفاتورة في ZATCA" },
      { status: 500 }
    );
  }
}
