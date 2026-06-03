"use client";

import { useLanguage } from "@/components/language-provider";

export default function Error({
  reset,
}: {
  reset: () => void;
}) {
  const { dict } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6">⚠️</div>
        <h1 className="text-2xl font-black text-[#0d2818] mb-2">{dict.common.error}</h1>
        <p className="text-gray-500 text-sm mb-8">{dict.common.networkError}</p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-[#1a5632] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20"
        >
          🔄 إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
