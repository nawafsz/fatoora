import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testConnection } from "@/lib/zatca";
import { apiAuthGuard } from "@/lib/security";
import { decrypt } from "@/lib/encryption";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const zatcaConfig = await db.zatcaConfig.findUnique({
    where: { userId: session!.user!.id },
  });

  let clientId: string | undefined;
  let clientSecret: string | undefined;
  if (zatcaConfig?.avtaxClientId) {
    try { clientId = decrypt(zatcaConfig.avtaxClientId); } catch {}
  }
  if (zatcaConfig?.avtaxClientSecret) {
    try { clientSecret = decrypt(zatcaConfig.avtaxClientSecret); } catch {}
  }

  const result = await testConnection({
    userId: session!.user!.id,
    clientId,
    clientSecret,
  });
  return NextResponse.json(result);
}
