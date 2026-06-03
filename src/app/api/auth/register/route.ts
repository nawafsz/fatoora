import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { csrfGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { registerSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!(await checkRateLimit(`register:${ip}`, 3))) {
      return NextResponse.json({ error: "طلبات كثيرة جداً. حاول بعد دقيقة." }, { status: 429 });
    }

    const json = await req.json();
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
    }

    const { name, email, password, phone } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || "",
        plan: "free",
      },
    });

    await db.settings.create({
      data: { userId: user.id, invoicePrefix: "INV-", nextNumber: 1 },
    });

    await db.zatcaConfig.create({
      data: { userId: user.id, environment: "sandbox" },
    });

    await auditLog({
      userId: user.id,
      action: "register",
      resource: "auth",
      details: { ip },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "حدث خطأ أثناء التسجيل" }, { status: 500 });
  }
}
