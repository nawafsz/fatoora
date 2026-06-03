import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { cookies } from "next/headers";

export default async function ComplaintsPage() {
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
        <h1 className="text-3xl font-black mb-8">{dict.legal.complaints.heading}</h1>

        <section className="space-y-6 text-gray-600 leading-relaxed">
          <p>آخر تحديث: {new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}</p>

          <h2 className="text-xl font-bold text-[#0d2818]">١. مقدمة</h2>
          <p>
            تهدف هذه السياسة إلى تنظيم آلية تقديم الشكاوى والبلاغات وضمان معالجتها
            بفعالية وشفافية، وفقاً لنظام التجارة الإلكترونية في المملكة العربية السعودية.
          </p>

          <h2 className="text-xl font-bold text-[#0d2818]">٢. كيفية تقديم شكوى</h2>
          <p>يمكنك تقديم شكوى عبر إحدى الطرق التالية:</p>
          <ul className="space-y-3 mt-3">
            <li className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-bold text-[#0d2818]">📧 البريد الإلكتروني</p>
              <p className="text-sm mt-1">support@fatoora.sa</p>
              <p className="text-sm text-gray-400">نرد خلال ٢٤ ساعة عمل</p>
            </li>
            <li className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-bold text-[#0d2818]">💬 منصة معروف</p>
              <p className="text-sm mt-1">يمكنك تقديم شكوى عبر منصة معروف التابعة لوزارة التجارة</p>
            </li>
            <li className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-bold text-[#0d2818]">🏛️ وزارة التجارة</p>
              <p className="text-sm mt-1">يمكنك التواصل مع وزارة التجارة عبر تطبيق &ldquo;بلاغ تجاري&rdquo; أو الرقم ١٩٠٠</p>
            </li>
          </ul>

          <h2 className="text-xl font-bold text-[#0d2818]">٣. معلومات يجب تضمينها في الشكوى</h2>
          <ul className="list-disc pr-6 space-y-2">
            <li>الاسم الكامل ورقم الجوال</li>
            <li>البريد الإلكتروني المسجل في المنصة</li>
            <li>وصف تفصيلي للمشكلة</li>
            <li>رقم الفاتورة أو الاشتراك (إن وجد)</li>
            <li>المرفقات الداعمة (صور، مستندات)</li>
          </ul>

          <h2 className="text-xl font-bold text-[#0d2818]">٤. آلية المعالجة</h2>
          <ol className="list-decimal pr-6 space-y-2">
            <li>استلام الشكوى وتأكيد الاستلام خلال ٢٤ ساعة</li>
            <li>مراجعة الشكوى وجمع المعلومات اللازمة (٣ أيام عمل)</li>
            <li>التواصل مع مقدم الشكوى للاستيضاح إن لزم</li>
            <li>إصدار القرار وتبليغ مقدم الشكوى (خلال ٧ أيام عمل)</li>
            <li>في حال عدم الرضا، يمكن التوجه لوزارة التجارة</li>
          </ol>

          <h2 className="text-xl font-bold text-[#0d2818]">٥. مدة المعالجة</h2>
          <p>
            نتعهد بمعالجة جميع الشكاوى خلال مدة أقصاها ١٥ يوماً من تاريخ تقديمها.
            في الحالات المعقدة، سنقوم بإبلاغك بذلك مع تحديد المدة المتوقعة.
          </p>

          <h2 className="text-xl font-bold text-[#0d2818]">٦. التواصل مع الجهات الرقابية</h2>
          <p>
            إذا لم يتم حل شكواك، يمكنك التواصل مع وزارة التجارة عبر:
          </p>
          <ul className="space-y-1 mt-2">
            <li>تطبيق &ldquo;بلاغ تجاري&rdquo;</li>
            <li>الرقم الموحد: ١٩٠٠</li>
            <li>موقع الوزارة: mc.gov.sa</li>
          </ul>
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
