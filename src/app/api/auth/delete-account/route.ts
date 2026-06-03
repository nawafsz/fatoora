import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { deleteAccountSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  if (!(await checkRateLimit(`delete_account:${session!.user!.id}`, 2))) {
    return NextResponse.json({ error: "طلبات كثيرة جداً. حاول بعد دقيقة." }, { status: 429 });
  }

  const json = await req.json();
  const parsed = deleteAccountSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" }, { status: 400 });
  }

  const { password } = parsed.data;

  const user = await db.user.findUnique({ where: { id: session!.user!.id } });
  if (!user) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 403 });
  }

  await auditLog({
    userId: user.id,
    action: "delete_account",
    resource: "user",
  });

  await db.user.update({
    where: { id: user.id },
    data: {
      deletedAt: new Date(),
      email: `deleted_${user.id}@fatoora.sa`,
      phone: `deleted_${user.id}`,
    },
  });

  return NextResponse.json({ success: true });
}
