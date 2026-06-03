import { NextResponse } from "next/server";

// Stripe تم إيقافه — تم التحويل إلى Moyasar (بوابة سعودية مرخصة من SAMA)
// راجع /api/webhooks/moyasar للبوابة الجديدة
export async function POST() {
  return NextResponse.json({
    error: "Stripe متوقف. استخدم Moyasar بدلاً من ذلك.",
    migratedTo: "/api/webhooks/moyasar",
  }, { status: 410 });
}
