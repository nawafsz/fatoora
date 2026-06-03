import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { cookies } from "next/headers";

export default async function PrivacyPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as "ar" | "en") ?? "ar";
  const dict = await getTranslations(lang);

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#0d2818]">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-5 py-5 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1a5632] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xs">{dict.brand.logo}</span>
            </div>
            <span className="font-black text-lg">{dict.brand.name}</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-black mb-8">{dict.legal.privacy.heading}</h1>

        <section className="space-y-6 text-gray-600 leading-relaxed">
          <p>آخر تحديث: {new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}</p>

          <p>{dict.legal.privacy.intro}</p>

          <h2 className="text-xl font-bold text-[#0d2818]">١. البيانات التي نجمعها</h2>
          <ul className="list-disc pr-6 space-y-2">
            <li>بيانات الحساب: الاسم، البريد الإلكتروني، رقم الجوال</li>
            <li>بيانات النشاط التجاري: اسم الشركة، الرقم الضريبي، السجل التجاري، العنوان</li>
            <li>بيانات العملاء: الاسم، رقم الجوال، البريد الإلكتروني، الرقم الضريبي (بإذن من عميلك)</li>
            <li>بيانات الفواتير: رقم الفاتورة، المبلغ، التاريخ، الأصناف</li>
            <li>بيانات الدفع: تتم معالجتها عبر Stripe ولا نخزن معلومات البطاقة البنكية</li>
          </ul>

          <h2 className="text-xl font-bold text-[#0d2818]">٢. كيفية استخدام البيانات</h2>
          <ul className="list-disc pr-6 space-y-2">
            <li>تقديم خدمة الفوترة الإلكترونية والتكامل مع ZATCA</li>
            <li>إرسال الفواتير للعملاء عبر واتساب أو البريد الإلكتروني</li>
            <li>تحسين الخدمة وتطوير المنصة</li>
            <li>التواصل معك بخصوص الخدمة والإشعارات الهامة</li>
            <li>الامتثال للمتطلبات النظامية والضريبية</li>
          </ul>

          <h2 className="text-xl font-bold text-[#0d2818]">٣. حقوقك بموجب نظام حماية البيانات الشخصية</h2>
          <p>لك الحق في:</p>
          <ul className="list-disc pr-6 space-y-2">
            <li><strong>حق الوصول:</strong> طلب نسخة من بياناتك الشخصية</li>
            <li><strong>حق التصحيح:</strong> طلب تعديل بياناتك غير الصحيحة</li>
            <li><strong>حق الحذف:</strong> طلب حذف بياناتك (مع مراعاة المتطلبات النظامية)</li>
            <li><strong>حق تقييد المعالجة:</strong> طلب الحد من معالجة بياناتك</li>
            <li><strong>حق الاعتراض:</strong> الاعتراض على معالجة بياناتك لأغراض التسويق</li>
            <li><strong>حق نقل البيانات:</strong> طلب نقل بياناتك إلى مزود آخر</li>
          </ul>
          <p>لممارسة حقوقك، تواصل معنا على support@fatoora.sa وسنرد خلال ٣٠ يوماً.</p>

          <h2 className="text-xl font-bold text-[#0d2818]">٤. حماية البيانات وأمن المعلومات</h2>
          <ul className="list-disc pr-6 space-y-2">
            <li>جميع البيانات مشفرة أثناء النقل (TLS 1.3)</li>
            <li>كلمات المرور مخزنة بتقنية التشفير bcrypt (Salt Rounds: 12)</li>
            <li>لا نخزن أرقام البطاقات البنكية - الدفع عبر Stripe الآمن</li>
            <li>الوصول للبيانات مقيد ومصرح به فقط للضرورة</li>
            <li>نطبق إجراءات أمنية دورية ونسخ احتياطية</li>
          </ul>

          <h2 className="text-xl font-bold text-[#0d2818]">٥. مشاركة البيانات مع أطراف ثالثة</h2>
          <p>قد نشارك بياناتك مع:</p>
          <ul className="list-disc pr-6 space-y-2">
            <li><strong>ZATCA (هيئة الزكاة والضريبة والجمارك):</strong> لإرسال الفواتير إلكترونياً (مطلوب نظاماً)</li>
            <li><strong>Stripe:</strong> لمعالجة المدفوعات (مزود مدفوعات مرخص من SAMA)</li>
            <li><strong>Meta (WhatsApp):</strong> لإرسال الفواتير عبر واتساب</li>
          </ul>
          <p>لا نبيع بياناتك الشخصية لأي طرف ثالث لأغراض تسويقية.</p>

          <h2 className="text-xl font-bold text-[#0d2818]">٦. الاحتفاظ بالبيانات</h2>
          <p>
            نحتفظ ببياناتك طوال فترة استخدامك للخدمة ولمدة ٥ سنوات بعد ذلك وفقاً للمتطلبات
            الضريبية والأنظمة ذات العلاقة. بعد انتهاء هذه المدة، يتم إتلاف البيانات بشكل آمن.
          </p>

          <h2 className="text-xl font-bold text-[#0d2818]">٧. الإبلاغ عن خروقات البيانات</h2>
          <p>
            في حال حدوث أي خرق للبيانات قد يؤثر على خصوصيتك، سنقوم بإبلاغك والجهة المختصة
            (SDAIA) خلال ٧٢ ساعة من اكتشاف الخرق، وفقاً لنظام حماية البيانات الشخصية.
          </p>

          <h2 className="text-xl font-bold text-[#0d2818]">٨. ملفات تعريف الارتباط (Cookies)</h2>
          <p>
            نستخدم ملفات تعريف الارتباط الضرورية فقط لتشغيل الخدمة (جلسات تسجيل الدخول،
            إعدادات المستخدم). لا نستخدم ملفات تعريف الارتباط للتتبع الإعلاني.
          </p>

          <h2 className="text-xl font-bold text-[#0d2818]">٩. مسؤول حماية البيانات</h2>
          <p>
            يمكنك التواصل مع مسؤول حماية البيانات لدينا عبر: support@fatoora.sa
          </p>

          <h2 className="text-xl font-bold text-[#0d2818]">١٠. تحديثات السياسة</h2>
          <p>
            قد نقوم بتحديث هذه السياسة من وقت لآخر. سنقوم بإبلاغك بالتغييرات الجوهرية عبر
            البريد الإلكتروني أو إشعار في المنصة. يُعتبر استمرارك في استخدام الخدمة بعد التحديث
            موافقة على السياسة المحدثة.
          </p>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-3xl mx-auto px-5 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} {dict.brand.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
