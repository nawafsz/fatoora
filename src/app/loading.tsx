"use client";

import { useLanguage } from "@/components/language-provider";

export default function Loading() {
  const { dict } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#1a5632]/20 border-t-[#1a5632] rounded-full animate-spin" />
        <p className="text-sm text-gray-400">{dict?.common?.loading ?? "جاري التحميل..."}</p>
      </div>
    </div>
  );
}
