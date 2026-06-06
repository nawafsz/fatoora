"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function NewSubcontractPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { dict } = useLanguage();

  const [subcontractorId, setSubcontractorId] = useState("");
  const [scope, setScope] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [retentionRate, setRetentionRate] = useState("10");
  const [advancePayment, setAdvancePayment] = useState("0");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/subcontracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subcontractorId,
          scope,
          contractValue: Number(contractValue),
          retentionRate: Number(retentionRate),
          advancePayment: Number(advancePayment),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          notes: notes || undefined,
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
  const scopes = ["كهرباء", "سباكة", "تشطيب", "عمالة فقط", "مدني", "ميكانيكا", "دهان", "ألمنيوم", "زجاج", "أعمال خارجية"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-3"
        >
          {dict.projects.subcontracts.backToProject}
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{dict.projects.subcontracts.new}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.subcontracts.subcontractor}</label>
          <select value={subcontractorId} onChange={(e) => setSubcontractorId(e.target.value)} className={inputCls} required>
            <option value="">اختر مقاول الباطن</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.subcontracts.scope}</label>
          <select value={scope} onChange={(e) => setScope(e.target.value)} className={inputCls} required>
            <option value="">اختر نطاق العمل</option>
            {scopes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
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

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.startDate}</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.endDate}</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.notes}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls + " resize-none"} rows={2} />
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3"><p className="text-red-600 text-sm text-center">{error}</p></div>}

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
          ) : dict.projects.subcontracts.new}
        </button>
      </form>
    </div>
  );
}
