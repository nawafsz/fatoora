"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OnboardingCard({ invoiceCount, clientCount }: { invoiceCount: number; clientCount: number }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || invoiceCount > 0 || clientCount > 0) return null;

  return (
    <div className="bg-gradient-to-br from-[#1a5632] to-[#2d8a4e] text-white rounded-2xl p-6 md:p-8 shadow-lg mb-8 relative overflow-hidden">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />
      <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
      <div className="relative z-10">
        <h2 className="text-xl md:text-2xl font-black mb-2">👋 مرحباً بك في فاتورة!</h2>
        <p className="text-green-100 text-sm md:text-base mb-6 max-w-lg">
          أنت على بعد خطوتين من إصدار فاتورتك الأولى. أضف عميلاً ثم ابدأ.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/clients/new"
            className="bg-white text-[#1a5632] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-50 transition-all shadow-md"
          >
            + إضافة عميل
          </Link>
          <Link
            href="/dashboard/invoices/new"
            className="bg-white/15 text-white border border-white/30 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/25 transition-all"
          >
            + إصدار فاتورة
          </Link>
          <button
            onClick={() => { setDismissed(true); router.refresh(); }}
            className="text-xs text-green-200 hover:text-white transition-colors underline underline-offset-4"
          >
            تجاهل
          </button>
        </div>
      </div>
    </div>
  );
}
