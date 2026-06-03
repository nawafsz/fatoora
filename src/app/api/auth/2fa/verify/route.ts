import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { verifyTOTP } from "@/lib/totp";
import { decryptString } from "@/lib/encryption";
import { verify2faSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  if (!(await checkRateLimit(`2fa:verify:${session!.user!.id}`, 5))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً. حاول بعد دقيقة." }, { status: 429 });
  }

  const json = await req.json();
  const parsed = verify2faSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }

  const { code, enable } = parsed.data;

  const user = await db.user.findUnique({ where: { id: session!.user!.id } });
  if (!user || !user.totpSecret) {
    return NextResponse.json({ error: "لم يتم إعداد المصادقة الثنائية" }, { status: 400 });
  }

  const decryptedSecret = decryptString(user.totpSecret);
  if (!(await verifyTOTP(decryptedSecret, code))) {
    return NextResponse.json({ error: "رمز التحقق غير صحيح" }, { status: 400 });
  }

  await db.user.update({
    where: { id: user.id },
    data: { totpEnabled: enable ?? true },
  });

  await auditLog({
    userId: user.id,
    action: enable ? "enable_2fa" : "disable_2fa",
    resource: "auth",
  });

  return NextResponse.json({ success: true, enabled: enable ?? true });
}
