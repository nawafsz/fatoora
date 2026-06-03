import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { updateClientSchema } from "@/lib/validation";
import { encryptSensitive, decryptSensitive } from "@/lib/encryption";
import { auditLog } from "@/lib/audit";

const SENSITIVE_FIELDS = ["name", "phone", "email", "address"] as const;

async function getOwnedClient(id: string, userId: string) {
  return db.client.findFirst({ where: { id, userId } });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const clientNotFoundMsg = {
    ar: "العميل غير موجود",
    en: "Client not found",
  };

  if (!(await checkRateLimit(`clients:get:${session!.user!.id}`, 60))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const { id } = await params;

  const client = await getOwnedClient(id, session!.user!.id);
  if (!client) {
    return NextResponse.json({ error: clientNotFoundMsg[lang] }, { status: 404 });
  }

  const decrypted = decryptSensitive(client as Record<string, unknown>, SENSITIVE_FIELDS) as typeof client;

  await auditLog({
    userId: session!.user!.id, action: "read", resource: "client", resourceId: id,
  });

  return NextResponse.json(decrypted);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const clientNotFoundMsg = {
    ar: "العميل غير موجود",
    en: "Client not found",
  };
  const invalidDataMsg = {
    ar: "بيانات غير صحيحة",
    en: "Invalid data",
  };

  if (!(await checkRateLimit(`clients:update:${session!.user!.id}`, 20))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const { id } = await params;

  const client = await getOwnedClient(id, session!.user!.id);
  if (!client) {
    return NextResponse.json({ error: clientNotFoundMsg[lang] }, { status: 404 });
  }

  const json = await req.json();
  const parsed = updateClientSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? invalidDataMsg[lang] }, { status: 400 });
  }

  const { name, phone, email, taxNumber, address } = parsed.data;

  const encrypted = encryptSensitive(
    {
      name: name ?? client.name,
      phone: phone !== undefined ? phone : client.phone ?? "",
      email: email !== undefined ? email : client.email ?? "",
      address: address !== undefined ? address : client.address ?? "",
    },
    SENSITIVE_FIELDS,
  );

  const updated = await db.client.update({
    where: { id },
    data: {
      name: encrypted.name,
      phone: encrypted.phone || null,
      email: encrypted.email || null,
      taxNumber: taxNumber !== undefined ? taxNumber : client.taxNumber,
      address: encrypted.address || null,
    },
  });

  const decrypted = decryptSensitive(updated as Record<string, unknown>, SENSITIVE_FIELDS) as typeof updated;

  await auditLog({
    userId: session!.user!.id,
    action: "update",
    resource: "client",
    resourceId: id,
  });

  return NextResponse.json(decrypted);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = csrfGuard(_req);
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
  const clientNotFoundMsg = {
    ar: "العميل غير موجود",
    en: "Client not found",
  };

  if (!(await checkRateLimit(`clients:delete:${session!.user!.id}`, 10))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const { id } = await params;

  const client = await getOwnedClient(id, session!.user!.id);
  if (!client) {
    return NextResponse.json({ error: clientNotFoundMsg[lang] }, { status: 404 });
  }

  await db.client.delete({ where: { id } });

  await auditLog({
    userId: session!.user!.id,
    action: "delete",
    resource: "client",
    resourceId: id,
  });

  return NextResponse.json({ success: true });
}
