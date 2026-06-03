import Link from "next/link";
import { getTranslations } from "@/lib/i18n";
import { cookies } from "next/headers";

export default async function TermsPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as "ar" | "en") ?? "ar";
  const dict = await getTranslations(lang);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-[#1a5632] font-bold hover:underline mb-6 inline-block">{dict.legal.terms.backLink}</Link>
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-6 leading-relaxed text-gray-700">
          <h1 className="text-3xl font-black text-[#0d2818]">{dict.legal.terms.heading}</h1>
          <p className="text-sm text-gray-400">{dict.legal.terms.lastUpdated}</p>

          <h2 className="text-xl font-bold text-[#0d2818] mt-8">١. قبول الشروط</h2>
          <p>باستخدامك لمنصة فاتورة، فإنك توافق على هذه الشروط. إذا كنت لا توافق، لا يُسمح لك باستخدام المنصة.</p>

          <h2 className="text-xl font-bold text-[#0d2818] mt-8">٢. وصف الخدمة</h2>
          <p>فاتورة هي منصة فوترة إلكترونية سحابية متوافقة مع ZATCA، تتيح للمستخدمين إصدار فواتير إلكترونية وتوليد QR codes بصيغة TLV وإرسال الفواتير عبر واتساب وتحميل PDF.</p>

          <h2 className="text-xl font-bold text-[#0d2818] mt-8">٣. الحسابات والتسجيل</h2>
          <ul className="list-disc pr-6 space-y-2">
            <li>يجب أن يكون عمرك ١٨ سنة أو أكثر</li>
            <li>أنت مسؤول عن الحفاظ على سرية حسابك</li>
            <li>يمنع إنشاء أكثر من حساب واحد</li>
            <li>يجب أن تكون المعلومات المقدمة صحيحة وكاملة</li>
          </ul>

          <h2 className="text-xl font-bold text-[#0d2818] mt-8">٤. الخطط والمدفوعات</h2>
          <ul className="list-disc pr-6 space-y-2">
            <li>الخطة المجانية: ٥ فواتير شهرياً بدون تكلفة</li>
            <li>الخطط المدفوعة تُدفع شهرياً وتُجدد تلقائياً</li>
            <li>يمكنك إلغاء الاشتراك في أي وقت من لوحة التحكم</li>
            <li>أسعار الخطط كما هو موضح في صفحة الباقات</li>
          </ul>

          <h2 className="text-xl font-bold text-[#0d2818] mt-8">٥. الاستخدام المسؤول</h2>
          <ul className="list-disc pr-6 space-y-2">
            <li>يمنع استخدام المنصة لأي نشاط غير قانوني</li>
            <li>أنت مسؤول عن دقة بيانات الفواتير التي تُصدرها</li>
            <li>يمنع محاولة اختراق المنصة أو الإضرار بها</li>
            <li>نحتفظ بالحق في تعليق أي حساب يخالف الشروط</li>
          </ul>

          <h2 className="text-xl font-bold text-[#0d2818] mt-8">٦. الملكية الفكرية</h2>
          <p>جميع حقوق المنصة محفوظة. أنت تمتلك بياناتك وفواتيرك، ونحن نمتلك المنصة والكود والعلامة التجارية.</p>

          <h2 className="text-xl font-bold text-[#0d2818] mt-8">٧. إخلاء مسؤولية</h2>
          <p>نقدم المنصة &ldquo;كما هي&rdquo; دون ضمانات. لسنا مسؤولين عن أي أضرار ناتجة عن استخدام المنصة. لا نضمن توفر الخدمة بشكل متواصل دون انقطاع.</p>

          <h2 className="text-xl font-bold text-[#0d2818] mt-8">٨. الامتثال لـ ZATCA</h2>
          <p>المنصة تساعدك في إصدار فواتير متوافقة مع ZATCA، لكنك تتحمل المسؤولية الكاملة عن الامتثال للأنظمة والتشريعات الضريبية في المملكة العربية السعودية.</p>

          <h2 className="text-xl font-bold text-[#0d2818] mt-8">٩. تعديل الشروط</h2>
          <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو الإشعارات في المنصة.</p>

          <h2 className="text-xl font-bold text-[#0d2818] mt-8">١٠. القانون المطبق</h2>
          <p>تخضع هذه الشروط للقوانين والأنظمة في المملكة العربية السعودية.</p>
        </article>
      </div>
    </div>
  );
}
