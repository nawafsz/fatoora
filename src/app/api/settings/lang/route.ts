import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { csrfGuard, apiAuthGuard } from "@/lib/security";

export async function PUT(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const { language } = await req.json();
  const langInvalidMsg = {
    ar: "لغة غير صالحة",
    en: "Invalid language",
  };
  const settings = await db.settings.findUnique({
    where: { userId: session!.user!.id },
    select: { language: true },
  });
  const lang = (settings?.language ?? "ar") as "ar" | "en";

  if (!["ar", "en"].includes(language)) {
    return NextResponse.json({ error: langInvalidMsg[lang] }, { status: 400 });
  }

  await db.settings.upsert({
    where: { userId: session!.user!.id },
    update: { language },
    create: { userId: session!.user!.id, language },
  });

  return NextResponse.json({ success: true });
}
