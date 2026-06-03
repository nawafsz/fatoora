import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { csrfGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { forgotPasswordSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/email";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const json = await req.json();
  const parsed = forgotPasswordSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "البريد الإلكتروني غير صحيح" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`forgot:${ip}`, 3))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً. حاول بعد دقيقة." }, { status: 429 });
  }

  const { email } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });

  let devLink: string | undefined;

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashToken(token),
        resetTokenExpires: expires,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}&email=${email}`;

    if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) {
      devLink = resetLink;
    } else {
      await sendPasswordResetEmail(email, resetLink);
    }

    await auditLog({
      userId: user.id,
      action: "forgot_password",
      resource: "auth",
      details: { ip },
    });
  }

  return NextResponse.json({
    success: true,
    message: "إذا كان البريد مسجلاً، ستصل رسالة إعادة التعيين",
    ...(devLink ? { devLink } : {}),
  });
}
