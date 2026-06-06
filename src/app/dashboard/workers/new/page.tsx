"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function NewWorkerPage() {
  const router = useRouter();
  const { dict } = useLanguage();

  const [name, setName] = useState("");
  const [iqamaNumber, setIqamaNumber] = useState("");
  const [iqamaExpiry, setIqamaExpiry] = useState("");
  const [nationality, setNationality] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          iqamaNumber: iqamaNumber || undefined,
          iqamaExpiry: iqamaExpiry || undefined,
          nationality: nationality || undefined,
          jobTitle: jobTitle || undefined,
          phone: phone || undefined,
          dailyRate: Number(dailyRate),
          notes: notes || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? dict.common.error); return; }
      router.push("/dashboard/workers");
      router.refresh();
    } catch { setError(dict.common.networkError); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white";
  const nationalities = ["السعودية", "مصر", "الهند", "باكستان", "بنغلاديش", "سريلانكا", "اليمن", "السودان", "الأردن", "سوريا", "لبنان", "فلبين", "إندونيسيا", "تركيا"];
  const jobTitles = ["بناء", "حداد", "نجار", "كهربائي", "سباك", "دهان", "بلاط", "عامل نظافة", "سائق", "مشرف", "مهندس", "مساح"];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/workers" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-3">{dict.workers.backToList}</Link>
        <h1 className="text-2xl font-black text-[#0d2818]">{dict.workers.new.heading}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.workers.new.name}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.workers.new.iqamaNumber}</label>
            <input type="text" value={iqamaNumber} onChange={(e) => setIqamaNumber(e.target.value)} className={inputCls} dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.workers.new.nationality}</label>
            <select value={nationality} onChange={(e) => setNationality(e.target.value)} className={inputCls}>
              <option value="">اختر</option>
              {nationalities.map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.workers.new.jobTitle}</label>
            <select value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputCls}>
              <option value="">اختر</option>
              {jobTitles.map((j) => (<option key={j} value={j}>{j}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.workers.new.phone}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.workers.new.dailyRate}</label>
            <input type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} className={inputCls} min="0" step="0.01" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.workers.new.iqamaExpiry}</label>
            <input type="date" value={iqamaExpiry} onChange={(e) => setIqamaExpiry(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.workers.new.notes}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls + " resize-none"} rows={2} />
        </div>
        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3"><p className="text-red-600 text-sm text-center">{error}</p></div>}
        <button type="submit" disabled={loading} className="w-full bg-[#1a5632] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#2d8a4e] transition-all shadow-xl shadow-[#1a5632]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />{dict.workers.new.loading}</span> : dict.workers.new.submit}
        </button>
      </form>
    </div>
  );
}
