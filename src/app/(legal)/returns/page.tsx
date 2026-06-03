import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { cookies } from "next/headers";

export default async function ReturnsPage() {
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
        <h1 className="text-3xl font-black mb-8">{dict.legal.returns.heading}</h1>

        <section className="space-y-6 text-gray-600 leading-relaxed">
          <p>آخر تحديث: {new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}</p>

          <h2 className="text-xl font-bold text-[#0d2818]">١. مقدمة</h2>
          <p>
            نحن في فاتورة نسعى لإرضاء عملائنا. توضح هذه السياسة حقوقك في استرجاع أو استبدال
            الخدمات المشتراة من منصتنا، وذلك وفقاً لنظام التجارة الإلكترونية في المملكة العربية السعودية.
          </p>

          <h2 className="text-xl font-bold text-[#0d2818]">٢. الحق في الاسترجاع</h2>
          <p>
            وفقاً لنظام التجارة الإلكترونية، يحق لك إلغاء الاشتراك خلال ٧ أيام من تاريخ الشراء
            مع استرداد كامل المبلغ، وذلك في الحالات التالية:
          </p>
          <ul className="list-disc pr-6 space-y-2">
            <li>لم تبدأ بعد في استخدام الخدمة (لم تصدر أي فاتورة)</li>
            <li>لم يتم تفعيل الاشتراك بعد</li>
          </ul>

          <h2 className="text-xl font-bold text-[#0d2818]">٣. حالات لا يشملها الاسترجاع</h2>
          <ul className="list-disc pr-6 space-y-2">
            <li>إذا تم إصدار فواتير باستخدام الخدمة</li>
            <li>إذا تجاوزت مدة ٧ أيام من تاريخ الشراء</li>
            <li>الباقات السنوية بعد مرور ٣٠ يوماً من الشراء</li>
          </ul>

          <h2 className="text-xl font-bold text-[#0d2818]">٤. إجراءات الاسترجاع</h2>
          <p>لتقديم طلب استرجاع، يرجى اتباع الخطوات التالية:</p>
          <ol className="list-decimal pr-6 space-y-2">
            <li>تواصل معنا عبر البريد الإلكتروني support@fatoora.sa</li>
            <li>قدم رقم الفاتورة وتاريخ الشراء</li>
            <li>سنقوم بمراجعة طلبك والرد خلال ٣ أيام عمل</li>
            <li>في حال الموافقة، سيتم رد المبلغ خلال ١٤ يوماً</li>
          </ol>

          <h2 className="text-xl font-bold text-[#0d2818]">٥. طريقة الاسترداد</h2>
          <p>
            يتم رد المبلغ عبر نفس طريقة الدفع التي استخدمتها في عملية الشراء. قد تختلف المدة
            حسب سياسة البنك أو مزود خدمة الدفع.
          </p>

          <h2 className="text-xl font-bold text-[#0d2818]">٦. التواصل</h2>
          <p>
            للاستفسارات أو تقديم طلب استرجاع، يمكنك التواصل عبر:
          </p>
          <ul className="space-y-1">
            <li>البريد الإلكتروني: support@fatoora.sa</li>
            <li>نموذج التواصل: متوفر في لوحة التحكم</li>
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
