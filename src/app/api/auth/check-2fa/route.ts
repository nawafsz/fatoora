import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { csrfGuard } from "@/lib/security";
import { checkRateLimit } from "@/lib/utils";
import { check2faSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`check2fa:${ip}`, 20))) {
    return NextResponse.json({ enabled: false });
  }

  const json = await req.json();
  const parsed = check2faSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ enabled: false });
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { totpEnabled: true, id: true, deletedAt: true },
  });

  await auditLog({
    userId: user?.id, action: "login", resource: "auth",
    details: { step: "check-2fa", email: parsed.data.email }, ip,
  });

  const isActiveUser = user && !user.deletedAt;
  const enabled = isActiveUser ? user.totpEnabled : false;
  return NextResponse.json({ enabled });
}
