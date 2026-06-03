import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "@/lib/i18n";
import { cookies } from "next/headers";

const featuresMeta = [
  { icon: "⚡", color: "from-emerald-50 to-green-50", border: "border-emerald-100" },
  { icon: "🔐", color: "from-blue-50 to-indigo-50", border: "border-blue-100" },
  { icon: "💬", color: "from-green-50 to-teal-50", border: "border-green-100" },
  { icon: "📊", color: "from-amber-50 to-yellow-50", border: "border-amber-100" },
  { icon: "🇸🇦", color: "from-rose-50 to-pink-50", border: "border-rose-100" },
  { icon: "💰", color: "from-violet-50 to-purple-50", border: "border-violet-100" },
];

const stepsMeta = [{ num: "١" }, { num: "٢" }, { num: "٣" }];

const testimonialsMeta = [
  { avatar: "م", stars: 5 },
  { avatar: "س", stars: 5 },
  { avatar: "خ", stars: 5 },
];

const plansMeta = [
  { key: "free", featured: false },
  { key: "starter", featured: false },
  { key: "pro", featured: true },
  { key: "premium", featured: false },
];

export default async function Home() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value as "ar" | "en") ?? "ar";
  const dict = await getTranslations(lang);

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">
      {/* ───── NAVBAR ───── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-[#1a5632] to-[#2d8a4e] rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-black">{dict.brand.logo}</span>
            </div>
            <span className="text-xl font-black text-[#0d2818] tracking-tight">{dict.brand.name}</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="#features" className="text-gray-500 hover:text-[#1a5632] transition-colors font-medium">
              {dict.nav.features}
            </Link>
            <Link href="#how" className="text-gray-500 hover:text-[#1a5632] transition-colors font-medium">
              {dict.nav.howItWorks}
            </Link>
            <Link href="#pricing" className="text-gray-500 hover:text-[#1a5632] transition-colors font-medium">
              {dict.nav.pricing}
            </Link>
            <Link
              href="/auth/login"
              className="text-[#1a5632] border border-[#1a5632]/30 px-5 py-2 rounded-lg font-semibold hover:bg-[#1a5632]/5 transition-all"
            >
              {dict.nav.login}
            </Link>
            <Link
              href="/auth/register"
              className="bg-[#1a5632] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#2d8a4e] transition-all shadow-sm"
            >
              {dict.nav.register}
            </Link>
          </nav>
          {/* Mobile CTA */}
          <Link
            href="/auth/register"
            className="md:hidden bg-[#1a5632] text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            {dict.nav.register}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ───── HERO ───── */}
        <section className="relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#f0faf4] via-white to-white pointer-events-none" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#1a5632]/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/4 pointer-events-none" />
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#d4a843]/5 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/4 pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-16">
            {/* Badge */}
            <div className="flex justify-center mb-8">
              <span className="inline-flex items-center gap-2 bg-[#1a5632]/8 text-[#1a5632] px-4 py-1.5 rounded-full text-sm font-semibold border border-[#1a5632]/15">
                <span className="w-2 h-2 bg-[#2d8a4e] rounded-full animate-pulse inline-block" />
                {dict.landing.hero.badge}
              </span>
            </div>

            {/* Headline */}
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-[2.75rem] md:text-6xl lg:text-7xl font-black text-[#0d2818] leading-[1.15] tracking-tight">
                {dict.landing.hero.headline1}
                <span className="relative mx-3">
                  <span className="relative z-10 text-[#1a5632]"> {dict.landing.hero.headline2}</span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#d4a843]/20 -rotate-1 z-0 rounded" />
                </span>
                <br />
                <span className="text-[#1a5632]">{dict.landing.hero.headline3}</span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-xl mx-auto leading-relaxed font-light">
                {dict.landing.hero.subtitle}
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/auth/register"
                  className="group relative bg-[#1a5632] text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-[#2d8a4e] transition-all shadow-xl shadow-[#1a5632]/20 hover:shadow-2xl hover:shadow-[#1a5632]/30 hover:-translate-y-0.5"
                >
                  {dict.landing.hero.cta}
                  <span className="mr-2">←</span>
                </Link>
                <Link
                  href="#how"
                  className="text-gray-600 px-6 py-4 rounded-2xl text-lg font-semibold hover:text-[#1a5632] hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <span className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-sm">▶</span>
                  {dict.landing.hero.howItWorks}
                </Link>
              </div>

              <p className="mt-4 text-sm text-gray-400">
                {dict.landing.hero.footnote}
              </p>
            </div>

            {/* Dashboard Preview */}
            <div className="mt-16 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none z-10 bottom-0 top-1/2" />
              <div className="relative mx-auto max-w-4xl">
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-gray-200 border border-gray-100 ring-1 ring-gray-100">
                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="flex-1 mx-4 bg-white rounded-md py-1 px-3 text-xs text-gray-400 text-center">
                      app.fatoora.sa
                    </div>
                  </div>
                  <Image
                    src="/dashboard-mockup.png"
                    alt={dict.brand.name}
                    width={960}
                    height={560}
                    className="w-full object-cover"
                    priority
                  />
                </div>
                {/* Floating invoice card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-48 hidden md:block">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-sm">✅</div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{dict.landing.floatingCards.submittedToZatca}</p>
                      <p className="text-xs text-gray-400">{dict.landing.floatingCards.momentsAgo}</p>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100 my-2" />
                  <p className="text-xs text-gray-500">{dict.landing.floatingCards.invoiceLabel} #1243</p>
                  <p className="text-lg font-black text-[#1a5632]">{dict.landing.floatingCards.amount}</p>
                </div>
                {/* Floating whatsapp card */}
                <div className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-52 hidden md:block">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{dict.landing.floatingCards.sentOnWhatsApp}</p>
                      <p className="text-xs text-green-600 font-semibold">{dict.landing.floatingCards.readReceipt}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── STATS BAR ───── */}
        <section className="bg-[#0d2818] text-white py-12 mt-8">
          <div className="max-w-5xl mx-auto px-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: dict.landing.stats.users, label: dict.landing.stats.activeUsers },
                { value: dict.landing.stats.invoices, label: dict.landing.stats.invoicesIssued },
                { value: dict.landing.stats.uptimeValue, label: dict.landing.stats.uptime },
                { value: dict.landing.stats.time, label: dict.landing.stats.issuanceTime },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-3xl md:text-4xl font-black text-[#d4a843]">{s.value}</p>
                  <p className="text-sm text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── FEATURES ───── */}
        <section id="features" className="py-24 bg-gray-50/50">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-16">
              <span className="text-[#1a5632] text-sm font-semibold bg-[#1a5632]/8 px-4 py-1.5 rounded-full border border-[#1a5632]/15">
                {dict.landing.features.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-[#0d2818] mt-4">
                {dict.landing.features.heading}
              </h2>
              <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                {dict.landing.features.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {featuresMeta.map((f, i) => (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${f.color} border ${f.border} rounded-2xl p-6 text-right hover:shadow-md hover:-translate-y-1 transition-all duration-300 group`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-lg text-[#0d2818] mb-2">{dict.landing.features.items[i].title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{dict.landing.features.items[i].desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── HOW IT WORKS ───── */}
        <section id="how" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-5">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1">
                <span className="text-[#1a5632] text-sm font-semibold bg-[#1a5632]/8 px-4 py-1.5 rounded-full border border-[#1a5632]/15">
                  {dict.landing.howItWorks.badge}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-[#0d2818] mt-4 mb-8">
                  {dict.landing.howItWorks.heading}
                </h2>
                <div className="space-y-6">
                  {stepsMeta.map((s, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-[#1a5632] text-white font-black text-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#1a5632]/20">
                        {s.num}
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0d2818] text-lg">{dict.landing.howItWorks.steps[i].title}</h3>
                        <p className="text-gray-500 text-sm mt-1">{dict.landing.howItWorks.steps[i].desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/auth/register"
                  className="mt-10 inline-block bg-[#1a5632] text-white px-7 py-3.5 rounded-xl font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20 hover:-translate-y-0.5"
                >
                  {dict.landing.howItWorks.cta} ←
                </Link>
              </div>
              <div className="order-1 md:order-2 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a5632]/10 to-[#d4a843]/10 rounded-3xl blur-3xl" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                  <Image
                    src="/invoice-preview.png"
                    alt={dict.brand.name}
                    width={600}
                    height={500}
                    className="w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── TESTIMONIALS ───── */}
        <section className="py-24 bg-[#f8fdf9]">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-14">
              <span className="text-[#1a5632] text-sm font-semibold bg-[#1a5632]/8 px-4 py-1.5 rounded-full border border-[#1a5632]/15">
                {dict.landing.testimonials.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-[#0d2818] mt-4">
                {dict.landing.testimonials.heading}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonialsMeta.map((t, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <span key={j} className="text-[#d4a843] text-lg">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">&ldquo;{dict.landing.testimonials.items[i].text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1a5632] text-white font-bold flex items-center justify-center">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-[#0d2818] text-sm">{dict.landing.testimonials.items[i].name}</p>
                      <p className="text-gray-400 text-xs">{dict.landing.testimonials.items[i].role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── PRICING ───── */}
        <section id="pricing" className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-14">
              <span className="text-[#1a5632] text-sm font-semibold bg-[#1a5632]/8 px-4 py-1.5 rounded-full border border-[#1a5632]/15">
                {dict.landing.pricing.badge}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-[#0d2818] mt-4">
                {dict.landing.pricing.heading}
              </h2>
              <p className="text-gray-500 mt-3">{dict.landing.pricing.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-4 gap-5">
              {plansMeta.map((p) => {
                const planDict = dict.landing.pricing.plans[p.key as keyof typeof dict.landing.pricing.plans];
                return (
                  <div
                    key={p.key}
                    className={`relative rounded-2xl border p-7 text-right flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                      p.featured
                        ? "border-[#d4a843] bg-gradient-to-b from-[#fffbf0] to-white shadow-xl shadow-[#d4a843]/15 ring-2 ring-[#d4a843]/30"
                        : "border-gray-100 bg-white hover:shadow-md"
                    }`}
                  >
                    {p.featured && (
                      <div className="absolute -top-3.5 right-0 left-0 flex justify-center">
                        <span className="bg-[#d4a843] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                          ⭐ {dict.landing.pricing.popular}
                        </span>
                      </div>
                    )}
                    <div className="mt-2">
                      <h3 className="text-xl font-black text-[#0d2818]">{planDict.name}</h3>
                    </div>
                    <div className="my-5 border-t border-gray-100 pt-5">
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-4xl font-black text-[#1a5632]">{planDict.price}</span>
                        <span className="text-gray-400 text-sm">{planDict.period}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{planDict.limit}</p>
                    </div>
                    <ul className="space-y-2.5 flex-1">
                      {planDict.features.map((feat: string, j: number) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-[#1a5632] font-bold text-base flex-shrink-0">✓</span>
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/auth/register"
                      className={`mt-7 block w-full py-3 rounded-xl text-sm font-bold text-center transition-all ${
                        p.featured
                          ? "bg-[#d4a843] text-white hover:bg-[#e8c46a] shadow-md shadow-[#d4a843]/30"
                          : planDict.price === "٠"
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-[#1a5632] text-white hover:bg-[#2d8a4e] shadow-md shadow-[#1a5632]/20"
                      }`}
                    >
                      {planDict.cta}
                    </Link>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-sm text-gray-400 mt-8">
              {dict.landing.pricing.footnote}
            </p>
          </div>
        </section>

      </main>

      {/* ───── FOOTER ───── */}
      <footer className="bg-[#0d2818] text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#1a5632] rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-sm">{dict.brand.logo}</span>
              </div>
              <span className="text-white font-black text-xl">{dict.brand.name}</span>
            </div>
            <div className="flex gap-6 text-sm flex-wrap justify-center">
              <Link href="#features" className="hover:text-white transition-colors">{dict.nav.features}</Link>
              <Link href="#pricing" className="hover:text-white transition-colors">{dict.nav.pricing}</Link>
              <Link href="/auth/login" className="hover:text-white transition-colors">{dict.nav.login}</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">{dict.landing.footer.privacy}</Link>
              <Link href="/terms" className="hover:text-white transition-colors">{dict.landing.footer.terms}</Link>
              <Link href="/returns" className="hover:text-white transition-colors">{dict.landing.footer.returns}</Link>
              <Link href="/complaints" className="hover:text-white transition-colors">{dict.landing.footer.complaints}</Link>
            </div>
            <div className="text-sm text-center md:text-right">
              <p className="text-gray-500">{dict.landing.footer.copyright}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
