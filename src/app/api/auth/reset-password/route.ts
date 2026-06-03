import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { csrfGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { resetPasswordSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`reset:${ip}`, 5))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً. حاول بعد دقيقة." }, { status: 429 });
  }

  const json = await req.json();
  const parsed = resetPasswordSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }

  const { email, token, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });

  if (!user || !user.resetToken || !user.resetTokenExpires) {
    return NextResponse.json({ error: "طلب إعادة تعيين غير صالح" }, { status: 400 });
  }

  const hashedInput = crypto.createHash("sha256").update(token).digest("hex");
  const inputBuf = Buffer.from(hashedInput);
  const storedBuf = Buffer.from(user.resetToken);
  const tokenMatch = inputBuf.length === storedBuf.length && crypto.timingSafeEqual(inputBuf, storedBuf);

  if (!tokenMatch) {
    return NextResponse.json({ error: "رمز التحقق غير صحيح" }, { status: 400 });
  }

  if (user.resetTokenExpires < new Date()) {
    return NextResponse.json({ error: "رمز التحقق منتهي الصلاحية" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
      loginAttempts: 0,
      lockedUntil: null,
    },
  });

  await auditLog({
    userId: user.id,
    action: "reset_password",
    resource: "auth",
    details: { ip },
  });

  return NextResponse.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
}
