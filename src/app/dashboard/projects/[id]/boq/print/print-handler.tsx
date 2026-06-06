"use client";

import { useEffect } from "react";
import Link from "next/link";

export function PrintHandler({
  projectId,
  backLabel,
  printLabel,
}: {
  projectId: string;
  backLabel: string;
  printLabel: string;
}) {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="no-print flex items-center justify-between mb-6 print:hidden">
      <Link href={`/dashboard/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors">
        {`← ${backLabel}`}
      </Link>
      <button onClick={() => window.print()} className="bg-[#1a5632] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-lg cursor-pointer">
        🖨️ {printLabel}
      </button>
    </div>
  );
}
