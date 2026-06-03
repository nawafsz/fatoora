import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n";
import Link from "next/link";
import { OnboardingCard } from "./onboarding-card";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const settings = await db.settings.findUnique({
    where: { userId: userId! },
    select: { language: true },
  });
  const dict = await getTranslations(settings?.language ?? "ar");
  const locale = settings?.language === "en" ? "en-US" : "ar-SA";

  const [invoiceCount, clientCount, totalRevenue, pendingInvoices] = await Promise.all([
    db.invoice.count({
      where: {
        userId,
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    db.client.count({ where: { userId } }),
    db.invoice.aggregate({
      where: { userId, status: { in: ["SUBMITTED", "COMPLETED"] } },
      _sum: { total: true },
    }),
    db.invoice.count({ where: { userId, status: "DRAFT" } }),
  ]);

  const planKey = (session?.user?.plan ?? "free") as string;
  const planLabel = planKey === "free" ? dict.landing.pricing.plans.free.name : (dict.billing.plans as Record<string, { name: string }>)[planKey]?.name ?? planKey;

  const stats = [
    {
      label: dict.dashboard.home.currentPlan,
      value: planLabel,
      icon: "💎",
      color: "from-violet-50 to-purple-50",
      border: "border-violet-100",
      textColor: "text-violet-700",
    },
    {
      label: dict.dashboard.home.invoicesThisMonth,
      value: invoiceCount.toLocaleString(locale),
      icon: "📄",
      color: "from-emerald-50 to-green-50",
      border: "border-emerald-100",
      textColor: "text-[#1a5632]",
    },
    {
      label: dict.dashboard.home.totalClients,
      value: clientCount.toLocaleString(locale),
      icon: "👥",
      color: "from-blue-50 to-indigo-50",
      border: "border-blue-100",
      textColor: "text-blue-700",
    },
    {
      label: dict.dashboard.home.verifiedRevenue,
      value: `${Number(totalRevenue._sum.total ?? 0).toLocaleString(locale)} ${dict.dashboard.home.currency}`,
      icon: "💰",
      color: "from-amber-50 to-yellow-50",
      border: "border-amber-100",
      textColor: "text-amber-700",
    },
  ];

  const quickActions = [
    {
      href: "/dashboard/invoices/new",
      icon: "➕",
      title: dict.dashboard.home.newInvoice.title,
      desc: dict.dashboard.home.newInvoice.desc,
      bg: "bg-gradient-to-br from-[#1a5632] to-[#2d8a4e]",
      text: "text-white",
      descText: "text-green-100",
    },
    {
      href: "/dashboard/clients",
      icon: "👤",
      title: dict.dashboard.home.manageClients.title,
      desc: dict.dashboard.home.manageClients.desc,
      bg: "bg-white",
      text: "text-[#0d2818]",
      descText: "text-gray-400",
    },
    {
      href: "/dashboard/invoices",
      icon: "📋",
      title: dict.dashboard.home.allInvoices.title,
      desc:
        pendingInvoices > 0
          ? `${pendingInvoices.toLocaleString(locale)} ${dict.dashboard.home.allInvoices.desc}`
          : dict.dashboard.home.allInvoices.desc,
      bg: "bg-white",
      text: "text-[#0d2818]",
      descText: "text-gray-400",
    },
    {
      href: "/dashboard/settings",
      icon: "⚙️",
      title: dict.dashboard.home.settings.title,
      desc: dict.dashboard.home.settings.desc,
      bg: "bg-white",
      text: "text-[#0d2818]",
      descText: "text-gray-400",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <OnboardingCard invoiceCount={invoiceCount} clientCount={clientCount} />

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">
            {dict.dashboard.home.welcome}{" "}
            <span className="text-[#1a5632]">{session?.user?.name}</span> 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="hidden md:flex items-center gap-2 bg-[#1a5632] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20 hover:-translate-y-0.5"
        >
          <span className="text-lg">+</span>
          {dict.nav.newInvoice}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-2xl p-5`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className={`text-2xl font-black ${stat.textColor}`}>{stat.value}</p>
            <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ZATCA compliance banner */}
      <div className="bg-gradient-to-l from-[#0d2818] to-[#1a5632] rounded-2xl p-5 flex items-center justify-between text-white shadow-xl shadow-[#1a5632]/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
            🔐
          </div>
          <div>
            <p className="font-bold">{dict.dashboard.home.zatcaBanner.heading}</p>
            <p className="text-green-200 text-sm">{dict.dashboard.home.zatcaBanner.desc}</p>
          </div>
        </div>
        <span className="text-green-300 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full hidden md:block">
          {dict.dashboard.home.zatcaBanner.active}
        </span>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-[#0d2818] mb-4">{dict.dashboard.home.quickActions}</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className={`${action.bg} rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 ${i === 0 ? "shadow-lg shadow-[#1a5632]/20 border-0" : ""}`}
            >
              <span className="text-3xl block mb-3">{action.icon}</span>
              <p className={`font-bold text-lg ${action.text}`}>{action.title}</p>
              <p className={`text-sm mt-1 ${action.descText}`}>{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
