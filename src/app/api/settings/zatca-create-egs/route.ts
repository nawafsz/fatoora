import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { loginAsPartner, createEgsUnit } from "@/lib/zatca";
import { apiAuthGuard, csrfGuard } from "@/lib/security";
import { encrypt } from "@/lib/encryption";
import { db } from "@/lib/db";
import { clearTokenCache } from "@/lib/zatca";

export async function POST(req: Request) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;

  const session = await auth();
  const guard = apiAuthGuard(session);
  if (guard) return guard;

  const json = await req.json();
  const { email, password, organizationName, vatNumber, city, street, buildingNumber, postalCode, additionalID, serialNumber, otp, isProduction } = json;

  if (!email || !password) {
    return NextResponse.json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" }, { status: 400 });
  }

  try {
    // 1. تسجيل دخول الشريك
    const partnerToken = await loginAsPartner(email, password);

    // 2. إنشاء EGS Unit
    const result = await createEgsUnit(partnerToken, {
      organizationName: organizationName || undefined,
      vatNumber: vatNumber || undefined,
      city: city || undefined,
      street: street || undefined,
      buildingNumber: buildingNumber || undefined,
      postalCode: postalCode || undefined,
      additionalID: additionalID || undefined,
      serialNumber: serialNumber || undefined,
      otp: otp || undefined,
      isProduction: isProduction || false,
    });

    // 3. حفظ بيانات ZATCA في قاعدة البيانات
    const zatcaData: Record<string, unknown> = {
      avtaxClientId: encrypt(result.clientId),
      avtaxClientSecret: encrypt(result.clientSecret),
    };
    if (result.deviceSerialNumber) {
      zatcaData.deviceSerialNumber = result.deviceSerialNumber;
    }

    const existingZatca = await db.zatcaConfig.findUnique({
      where: { userId: session!.user!.id },
    });

    if (existingZatca) {
      await db.zatcaConfig.update({
        where: { userId: session!.user!.id },
        data: zatcaData as any,
      });
    } else {
      await db.zatcaConfig.create({
        data: { userId: session!.user!.id, ...zatcaData } as any,
      });
    }

    // 4. مسح التوكن المخبؤ
    clearTokenCache(session!.user!.id);

    return NextResponse.json({
      success: true,
      clientId: result.clientId,
      clientSecret: result.clientSecret,
      egsUnitId: result.egsUnitId,
      deviceSerialNumber: result.deviceSerialNumber,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "فشل إنشاء EGS Unit";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
