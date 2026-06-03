import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { createClientSchema } from "@/lib/validation";
import { encryptSensitive, decryptSensitive } from "@/lib/encryption";
import { auditLog } from "@/lib/audit";

const SENSITIVE_FIELDS = ["name", "phone", "email", "address"] as const;

export async function GET(_req: Request) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const settings = await db.settings.findUnique({
    where: { userId: session!.user!.id },
    select: { language: true },
  });
  const lang = (settings?.language ?? "ar") as "ar" | "en";
  const rateLimitMsg = {
    ar: "طلبات كثيرة جداً. حاول بعد دقيقة.",
    en: "Too many requests. Please try again in a minute.",
  };

  if (!(await checkRateLimit(`clients:list:${session!.user!.id}`, 60))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const clients = await db.client.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
  });

  const decrypted = clients.map((c) => decryptSensitive(c as Record<string, unknown>, SENSITIVE_FIELDS) as typeof c);

  await auditLog({
    userId: session!.user!.id, action: "read", resource: "client",
    details: { count: clients.length },
  });

  return NextResponse.json(decrypted);
}

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const settings = await db.settings.findUnique({
    where: { userId: session!.user!.id },
    select: { language: true },
  });
  const lang = (settings?.language ?? "ar") as "ar" | "en";
  const rateLimitMsg = {
    ar: "طلبات كثيرة جداً. حاول بعد دقيقة.",
    en: "Too many requests. Please try again in a minute.",
  };
  const invalidDataMsg = {
    ar: "بيانات غير صحيحة",
    en: "Invalid data",
  };

  if (!(await checkRateLimit(`clients:create:${session!.user!.id}`, 20))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const json = await req.json();
  const parsed = createClientSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? invalidDataMsg[lang] }, { status: 400 });
  }

  const { name, phone, email, taxNumber, address } = parsed.data;

  const encrypted = encryptSensitive(
    { name, phone: phone ?? "", email: email ?? "", address: address ?? "" },
    SENSITIVE_FIELDS,
  );

  const client = await db.client.create({
    data: {
      name: encrypted.name,
      phone: encrypted.phone || null,
      email: encrypted.email || null,
      taxNumber: taxNumber ?? null,
      address: encrypted.address || null,
      userId: session!.user!.id,
    },
  });

  const decrypted = decryptSensitive(client as Record<string, unknown>, SENSITIVE_FIELDS) as typeof client;

  await auditLog({
    userId: session!.user!.id,
    action: "create",
    resource: "client",
    resourceId: client.id,
    details: { name },
  });

  return NextResponse.json(decrypted);
}
