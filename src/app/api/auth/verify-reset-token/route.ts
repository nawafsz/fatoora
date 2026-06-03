import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { csrfGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { verifyResetTokenSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`verifyreset:${ip}`, 10))) {
    return NextResponse.json({ valid: false });
  }

  const json = await req.json();
  const parsed = verifyResetTokenSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ valid: false });
  }

  const { email, token } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });

  if (!user || !user.resetToken || !user.resetTokenExpires) {
    await auditLog({
      action: "reset_password", resource: "auth",
      details: { email, step: "verify-token", result: "no-user" }, ip,
    });
    return NextResponse.json({ valid: false });
  }

  const hashedInput = crypto.createHash("sha256").update(token).digest("hex");
  const inputBuf = Buffer.from(hashedInput);
  const storedBuf = Buffer.from(user.resetToken);
  const tokenMatch = inputBuf.length === storedBuf.length && crypto.timingSafeEqual(inputBuf, storedBuf);

  if (!tokenMatch) {
    await auditLog({
      action: "reset_password", resource: "auth",
      details: { email, step: "verify-token", result: "token-mismatch" }, ip,
    });
    return NextResponse.json({ valid: false });
  }

  if (user.resetTokenExpires < new Date()) {
    await auditLog({
      action: "reset_password", resource: "auth",
      details: { email, step: "verify-token", result: "expired" }, ip,
    });
    return NextResponse.json({ valid: false });
  }

  await auditLog({
    userId: user.id, action: "reset_password", resource: "auth",
    details: { email, step: "verify-token", result: "valid" }, ip,
  });

  return NextResponse.json({ valid: true });
}
