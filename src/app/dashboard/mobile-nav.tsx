"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dict } from "@/lib/i18n";

const navLinks = [
  { href: "/dashboard", key: "home", icon: "⊞" },
  { href: "/dashboard/invoices", key: "invoices", icon: "📄" },
  { href: "/dashboard/clients", key: "clients", icon: "👥" },
  { href: "/dashboard/billing", key: "plans", icon: "💎" },
  { href: "/dashboard/support", key: "support", icon: "🛟" },
  { href: "/dashboard/settings", key: "settings", icon: "⚙️" },
];

export function MobileNav({ dict }: { dict: Dict }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 text-gray-500 text-xl transition-colors"
        aria-label={dict.nav.menu}
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-lg rounded-b-2xl md:hidden">
            <nav className="p-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-[#1a5632] hover:bg-[#1a5632]/5 transition-all"
                >
                  <span className="text-lg">{link.icon}</span>
                  {dict.nav[link.key as keyof typeof dict.nav]}
                </Link>
              ))}
              <hr className="my-2 border-gray-100" />
              <Link
                href="/dashboard/invoices/new"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-[#1a5632] text-white hover:bg-[#2d8a4e] transition-all"
              >
                <span>+</span> {dict.nav.newInvoice}
              </Link>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
