const REQUIRED: { key: string; label: string }[] = [
  { key: "DATABASE_URL", label: "رابط قاعدة البيانات" },
  { key: "AUTH_SECRET", label: "مفتاح المصادقة" },
  { key: "NEXTAUTH_URL", label: "رابط التطبيق" },
];

const OPTIONAL: { key: string; label: string }[] = [
  { key: "AVTAX_API_KEY", label: "مفتاح ZATCA" },
  { key: "AVTAX_API_URL", label: "رابط ZATCA API" },
  { key: "STRIPE_SECRET_KEY", label: "مفتاح Stripe (مهمل — استخدم Moyasar)" },
  { key: "STRIPE_PUBLISHABLE_KEY", label: "مفتاح Stripe العام (مهمل)" },
  { key: "STRIPE_WEBHOOK_SECRET", label: "مفتاح Webhook Stripe (مهمل)" },
  { key: "WHATSAPP_API_KEY", label: "مفتاح واتساب" },
  { key: "WHATSAPP_PHONE_ID", label: "معرف هاتف واتساب" },
  { key: "WHATSAPP_VERIFY_TOKEN", label: "مفتاح تحقق واتساب" },
  { key: "RESEND_API_KEY", label: "مفتاح الإيميلات" },
  { key: "EMAIL_FROM", label: "بريد المرسل" },
  { key: "ENCRYPTION_KEY", label: "مفتاح التشفير" },
  { key: "REDIS_URL", label: "رابط Redis" },
  { key: "MOYASAR_SECRET_KEY", label: "مفتاح Moyasar" },
  { key: "MOYASAR_PUBLISHABLE_KEY", label: "مفتاح Moyasar العام" },
  { key: "TAMARA_API_TOKEN", label: "مفتاح Tamara API" },
  { key: "TAMARA_NOTIFICATION_TOKEN", label: "مفتاح إشعارات Tamara" },
  { key: "TAMARA_PUBLIC_KEY", label: "مفتاح Tamara العام" },
  { key: "TAMARA_ENVIRONMENT", label: "بيئة Tamara (sandbox/production)" },
];

export function checkEnv() {
  if (typeof window !== "undefined") return;

  const missing: string[] = [];
  const empty: string[] = [];

  for (const { key, label } of REQUIRED) {
    if (!process.env[key]) missing.push(label);
  }

  for (const { key, label } of OPTIONAL) {
    if (!process.env[key]) empty.push(label);
  }

  if (missing.length > 0) {
    console.error(`❌ ${missing.length} متغيرات بيئة مطلوبة غير موجودة`);
  }

  if (empty.length > 0) {
    console.warn(`⚠️ ${empty.length} متغيرات بيئة اختيارية غير مضبوطة`);
  }

  return { missing, empty };
}
