import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { getTranslations } from "@/lib/i18n";
import { SignoutButton } from "@/components/signout-button";

const navLinks = [
  { href: "/dashboard", key: "home", icon: "⊞" },
  { href: "/dashboard/projects", key: "projects", icon: "🏗️" },
  { href: "/dashboard/invoices", key: "invoices", icon: "📄" },
  { href: "/dashboard/clients", key: "clients", icon: "👥" },
  { href: "/dashboard/workers", key: "workers", icon: "👷" },
  { href: "/dashboard/billing", key: "plans", icon: "💎" },
  { href: "/dashboard/support", key: "support", icon: "🛟" },
  { href: "/dashboard/settings", key: "settings", icon: "⚙️" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { companyName: true, name: true, role: true },
  });

  const settings = await db.settings.findUnique({
    where: { userId: session.user.id },
    select: { language: true },
  });

  const lang = settings?.language ?? "ar";
  const dict = await getTranslations(lang);

  const displayName = user?.companyName || user?.name || session.user.name || dict.brand.name;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "ف";

  return (
    <div className="flex h-screen flex-col bg-gray-50 overflow-hidden">
      {/* ── TOP HEADER ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm z-40 flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <MobileNav dict={dict} />
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-gradient-to-br from-[#1a5632] to-[#2d8a4e] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <span className="text-white text-sm font-black">{dict.brand.logo}</span>
                </div>
                <span className="text-xl font-black text-[#0d2818] tracking-tight">{dict.brand.name}</span>
              </Link>
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1 mr-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-[#1a5632] hover:bg-[#1a5632]/5 transition-all"
                >
                  <span className="text-base leading-none">{link.icon}</span>
                  {dict.nav[link.key as keyof typeof dict.nav]}
                </Link>
              ))}
              {user?.role === "admin" && (
                <div className="flex items-center gap-1 mr-2 pr-2 border-r border-amber-200">
                  <Link
                    href="/dashboard/admin"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-all"
                  >
                    <span className="text-base leading-none">⚙️</span>
                    الإدارة
                  </Link>
                  <Link
                    href="/dashboard/admin/tickets"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-all"
                  >
                    <span className="text-base leading-none">🎫</span>
                    التذاكر
                  </Link>
                </div>
              )}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* New invoice quick action */}
            <Link
              href="/dashboard/invoices/new"
              className="hidden md:flex items-center gap-2 bg-[#1a5632] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-sm hover:shadow-md"
            >
              <span>+</span>
              {dict.nav.newInvoice}
            </Link>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a5632] to-[#2d8a4e] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {initials}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-[#0d2818] leading-tight">{displayName}</p>
                <SignoutButton label={dict.nav.signout} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
