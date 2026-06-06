"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function EditWorkerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { dict } = useLanguage();

  const [name, setName] = useState("");
  const [iqamaNumber, setIqamaNumber] = useState("");
  const [iqamaExpiry, setIqamaExpiry] = useState("");
  const [nationality, setNationality] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/workers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setName(data.name ?? "");
        setIqamaNumber(data.iqamaNumber ?? "");
        setIqamaExpiry(data.iqamaExpiry ? data.iqamaExpiry.slice(0, 10) : "");
        setNationality(data.nationality ?? "");
        setJobTitle(data.jobTitle ?? "");
        setPhone(data.phone ?? "");
        setDailyRate(String(data.dailyRate ?? ""));
        setActive(data.active ?? true);
        setNotes(data.notes ?? "");
      })
      .catch(() => setError(dict.common.error))
      .finally(() => setInitialLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/workers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          iqamaNumber: iqamaNumber || undefined,
          iqamaExpiry: iqamaExpiry || undefined,
          nationality: nationality || undefined,
          jobTitle: jobTitle || undefined,
          phone: phone || undefined,
          dailyRate: Number(dailyRate),
          active,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? dict.common.error); return; }
      router.push(`/dashboard/workers/${id}`);
      router.refresh();
    } catch { setError(dict.common.networkError); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white";

  if (initialLoading) return <div className="max-w-3xl mx-auto"><div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm animate-pulse"><div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4" /><div className="h-4 bg-gray-100 rounded-lg w-32 mx-auto" /></div></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/dashboard/workers/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-3">{dict.workers.backToList}</Link>
        <h1 className="text-2xl font-black text-[#0d2818]">{dict.workers.edit.heading}</h1>
        <p className="text-gray-500 text-sm mt-1">{name}</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div><label className="block text-sm font-semibold mb-2">{dict.workers.edit.name}</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required /></div>
          <div><label className="block text-sm font-semibold mb-2">{dict.workers.edit.iqamaNumber}</label><input type="text" value={iqamaNumber} onChange={(e) => setIqamaNumber(e.target.value)} className={inputCls} dir="ltr" /></div>
          <div><label className="block text-sm font-semibold mb-2">{dict.workers.edit.nationality}</label><input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} className={inputCls} /></div>
          <div><label className="block text-sm font-semibold mb-2">{dict.workers.edit.jobTitle}</label><input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputCls} /></div>
          <div><label className="block text-sm font-semibold mb-2">{dict.workers.edit.phone}</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} dir="ltr" /></div>
          <div><label className="block text-sm font-semibold mb-2">{dict.workers.edit.dailyRate}</label><input type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} className={inputCls} min="0" step="0.01" required /></div>
          <div><label className="block text-sm font-semibold mb-2">{dict.workers.edit.iqamaExpiry}</label><input type="date" value={iqamaExpiry} onChange={(e) => setIqamaExpiry(e.target.value)} className={inputCls} /></div>
          <div className="flex items-center gap-3 pt-7">
            <input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-5 h-5 accent-[#1a5632]" />
            <label htmlFor="active" className="text-sm font-semibold">{dict.workers.edit.active}</label>
          </div>
        </div>
        <div><label className="block text-sm font-semibold mb-2">{dict.workers.edit.notes}</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls + " resize-none"} rows={2} /></div>
        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3"><p className="text-red-600 text-sm text-center">{error}</p></div>}
        <button type="submit" disabled={loading} className="w-full bg-[#1a5632] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#2d8a4e] transition-all shadow-xl shadow-[#1a5632]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />{dict.workers.edit.loading}</span> : dict.workers.edit.submit}
        </button>
      </form>
    </div>
  );
}
