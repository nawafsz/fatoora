"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function EditSubcontractPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const subId = params.subId as string;
  const { dict } = useLanguage();

  const [scope, setScope] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [retentionRate, setRetentionRate] = useState("10");
  const [advancePayment, setAdvancePayment] = useState("0");
  const [status, setStatus] = useState("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/subcontracts/${subId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setScope(data.scope ?? "");
        setContractValue(String(data.contractValue ?? ""));
        setRetentionRate(String(data.retentionRate ?? "10"));
        setAdvancePayment(String(data.advancePayment ?? "0"));
        setStatus(data.status ?? "active");
        setStartDate(data.startDate ? data.startDate.slice(0, 10) : "");
        setEndDate(data.endDate ? data.endDate.slice(0, 10) : "");
        setNotes(data.notes ?? "");
      })
      .catch(() => setError(dict.common.error))
      .finally(() => setInitialLoading(false));
  }, [projectId, subId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/subcontracts/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          contractValue: Number(contractValue),
          retentionRate: Number(retentionRate),
          advancePayment: Number(advancePayment),
          status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? dict.common.error); return; }
      router.push(`/dashboard/projects/${projectId}/subcontracts/${subId}`);
      router.refresh();
    } catch { setError(dict.common.networkError); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white";
  const scopes = ["كهرباء", "سباكة", "تشطيب", "عمالة فقط", "مدني", "ميكانيكا", "دهان", "ألمنيوم", "زجاج"];

  if (initialLoading) return <div className="max-w-3xl mx-auto"><div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm animate-pulse"><div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4" /><div className="h-4 bg-gray-100 rounded-lg w-32 mx-auto" /></div></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/dashboard/projects/${projectId}/subcontracts/${subId}`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-3">{dict.projects.subcontracts.backToProject}</Link>
        <h1 className="text-2xl font-black text-[#0d2818]">{dict.projects.subcontracts.edit}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.subcontracts.scope}</label>
          <select value={scope} onChange={(e) => setScope(e.target.value)} className={inputCls} required>
            {scopes.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.subcontracts.contractValue}</label>
            <input type="number" value={contractValue} onChange={(e) => setContractValue(e.target.value)} className={inputCls} min="0" step="0.01" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.subcontracts.retentionRate}</label>
            <input type="number" value={retentionRate} onChange={(e) => setRetentionRate(e.target.value)} className={inputCls} min="0" max="100" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.subcontracts.advancePayment}</label>
            <input type="number" value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value)} className={inputCls} min="0" step="0.01" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.startDate}</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.endDate}</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.subcontracts.status}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="active">نشط</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.notes}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls + " resize-none"} rows={2} />
        </div>
        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3"><p className="text-red-600 text-sm text-center">{error}</p></div>}
        <button type="submit" disabled={loading} className="w-full bg-[#1a5632] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#2d8a4e] transition-all shadow-xl shadow-[#1a5632]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />{dict.common.saving}</span> : dict.projects.subcontracts.edit}
        </button>
      </form>
    </div>
  );
}
