import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils";
import { csrfGuard, apiAuthGuard } from "@/lib/security";
import { updateSettingsSchema } from "@/lib/validation";
import { auditLog } from "@/lib/audit";

export async function GET(_req: Request) {
  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const settings_lang = await db.settings.findUnique({
    where: { userId: session!.user!.id },
    select: { language: true },
  });
  const lang = (settings_lang?.language ?? "ar") as "ar" | "en";
  const rateLimitMsg = {
    ar: "طلبات كثيرة جداً. حاول بعد دقيقة.",
    en: "Too many requests. Please try again in a minute.",
  };
  const userNotFoundMsg = {
    ar: "المستخدم غير موجود",
    en: "User not found",
  };

  if (!(await checkRateLimit(`settings:get:${session!.user!.id}`, 30))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const user = await db.user.findUnique({
    where: { id: session!.user!.id },
    include: { settings: true, zatcaConfig: true },
  });

  if (!user) {
    return NextResponse.json({ error: userNotFoundMsg[lang] }, { status: 404 });
  }

  await auditLog({
    userId: session!.user!.id, action: "read", resource: "settings",
  });

  return NextResponse.json({
    companyName: user.companyName ?? "",
    taxNumber: user.taxNumber ?? "",
    commercialReg: user.commercialReg ?? "",
    city: user.city ?? "",
    plan: user.plan,
    totpEnabled: user.totpEnabled,
    invoicePrefix: user.settings?.invoicePrefix ?? "INV-",
    defaultTaxRate: Number(user.settings?.defaultTaxRate ?? 15),
    language: user.settings?.language ?? "ar",
    zatcaEnv: user.zatcaConfig?.environment ?? "sandbox",
  });
}

export async function PUT(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const settings_lang = await db.settings.findUnique({
    where: { userId: session!.user!.id },
    select: { language: true },
  });
  const lang = (settings_lang?.language ?? "ar") as "ar" | "en";
  const rateLimitMsg = {
    ar: "طلبات كثيرة جداً. حاول بعد دقيقة.",
    en: "Too many requests. Please try again in a minute.",
  };
  const invalidDataMsg = {
    ar: "بيانات غير صحيحة",
    en: "Invalid data",
  };

  if (!(await checkRateLimit(`settings:update:${session!.user!.id}`, 10))) {
    return NextResponse.json({ error: rateLimitMsg[lang] }, { status: 429 });
  }

  const json = await req.json();
  const parsed = updateSettingsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? invalidDataMsg[lang] }, { status: 400 });
  }

  const { companyName, taxNumber, commercialReg, city, invoicePrefix, defaultTaxRate, language, zatcaEnv } = parsed.data;

  await db.user.update({
    where: { id: session!.user!.id },
    data: { companyName, taxNumber, commercialReg, city },
  });

  await db.settings.upsert({
    where: { userId: session!.user!.id },
    update: {
      invoicePrefix: invoicePrefix ?? "INV-",
      defaultTaxRate: defaultTaxRate ?? 15,
      language: language ?? "ar",
    },
    create: {
      userId: session!.user!.id,
      invoicePrefix: invoicePrefix ?? "INV-",
      defaultTaxRate: defaultTaxRate ?? 15,
      language: language ?? "ar",
    },
  });

  const existingZatca = await db.zatcaConfig.findUnique({ where: { userId: session!.user!.id } });

  if (existingZatca) {
    await db.zatcaConfig.update({
      where: { userId: session!.user!.id },
      data: { environment: zatcaEnv ?? "sandbox" },
    });
  } else if (zatcaEnv) {
    await db.zatcaConfig.create({
      data: { userId: session!.user!.id, environment: zatcaEnv },
    });
  }

  await auditLog({
    userId: session!.user!.id,
    action: "update",
    resource: "settings",
    details: { companyName, taxNumber },
  });

  return NextResponse.json({ success: true });
}
