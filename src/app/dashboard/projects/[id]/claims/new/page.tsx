"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function NewClaimPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { dict } = useLanguage();

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [completionPct, setCompletionPct] = useState("0");
  const [contractValue, setContractValue] = useState(0);
  const [retentionRate, setRetentionRate] = useState(10);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [previousClaims, setPreviousClaims] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setProjectName(data.name);
        setContractValue(Number(data.contractValue));
        setRetentionRate(Number(data.retentionRate));
        setAdvancePayment(Number(data.advancePayment));
        setPreviousClaims(Number(data.totalClaimed ?? 0));
      })
      .catch(() => setError(dict.common.error));
  }, [projectId]);

  const grossAmount = contractValue * (Number(completionPct) / 100);
  const retentionAmt = grossAmount * (retentionRate / 100);
  const advanceDeduct = previousClaims > 0 ? 0 : advancePayment;
  const netCurrent = Math.max(0, grossAmount - retentionAmt - advanceDeduct - previousClaims);
  const vatAmount = netCurrent * 0.15;
  const totalDue = netCurrent + vatAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodStart,
          periodEnd,
          completionPct: Number(completionPct),
          grossAmount: Math.round(grossAmount * 100) / 100,
          retentionAmt: Math.round(retentionAmt * 100) / 100,
          advanceDeduct: Math.round(advanceDeduct * 100) / 100,
          previousClaims: Math.round(previousClaims * 100) / 100,
          netCurrent: Math.round(netCurrent * 100) / 100,
          vatAmount: Math.round(vatAmount * 100) / 100,
          totalDue: Math.round(totalDue * 100) / 100,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? dict.common.error);
        return;
      }

      router.push(`/dashboard/projects/${projectId}`);
      router.refresh();
    } catch {
      setError(dict.common.networkError);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-3"
        >
          {dict.projects.backToList}
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{dict.projects.claims.newClaim}</h1>
        <p className="text-gray-500 text-sm mt-1">{projectName}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.claims.period} — {dict.projects.detail.from}</label>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.claims.period} — {dict.projects.detail.to}</label>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={inputCls} required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.claims.completionPct}</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              value={completionPct}
              onChange={(e) => setCompletionPct(e.target.value)}
              min="0"
              max="100"
              step="0.5"
              className="flex-1 accent-[#1a5632]"
            />
            <span className="text-lg font-black text-[#1a5632] w-16 text-center">{completionPct}%</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{dict.projects.claims.grossAmount}</span>
            <span className="font-bold text-[#0d2818]">{grossAmount.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{dict.projects.claims.retentionAmt} ({retentionRate}%)</span>
            <span className="font-bold text-red-600">- {retentionAmt.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{dict.projects.claims.advanceDeduct}</span>
            <span className="font-bold text-red-600">- {advanceDeduct.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{dict.projects.claims.previousClaims}</span>
            <span className="font-bold text-red-600">- {previousClaims.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{dict.projects.claims.netCurrent}</span>
            <span className="font-bold text-[#0d2818]">{netCurrent.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{dict.projects.claims.vatAmount} (15%)</span>
            <span className="font-bold text-[#1a5632]">+ {vatAmount.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between text-base">
            <span className="font-bold text-[#0d2818]">{dict.projects.claims.totalDue}</span>
            <span className="font-black text-[#1a5632] text-lg">{totalDue.toLocaleString("ar-SA", { minimumFractionDigits: 2 })} ر.س</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1a5632] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#2d8a4e] transition-all shadow-xl shadow-[#1a5632]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              {dict.common.saving}
            </span>
          ) : dict.projects.claims.newClaim}
        </button>
      </form>
    </div>
  );
}
