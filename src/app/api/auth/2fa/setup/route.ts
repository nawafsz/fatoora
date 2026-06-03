import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { generateSecret, generateTOTPUri } from "@/lib/totp";
import { encryptString } from "@/lib/encryption";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  if (!(await checkRateLimit(`2fa:setup:${session!.user!.id}`, 10))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً. حاول بعد دقيقة." }, { status: 429 });
  }

  const user = await db.user.findUnique({ where: { id: session!.user!.id } });
  if (!user) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  const secret = generateSecret();
  const uri = generateTOTPUri(secret, user.email);

  await db.user.update({
    where: { id: user.id },
    data: { totpSecret: encryptString(secret) },
  });

  await auditLog({
    userId: user.id, action: "enable_2fa", resource: "user",
    details: { step: "setup" },
  });

  return NextResponse.json({ secret, uri });
}
