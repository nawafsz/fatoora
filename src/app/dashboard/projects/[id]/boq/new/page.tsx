"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function NewBoqItemPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { dict } = useLanguage();

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("م2");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPrice = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/boq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code || undefined,
          description,
          unit,
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
          category: category || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? dict.common.error); return; }
      router.push(`/dashboard/projects/${projectId}`);
      router.refresh();
    } catch { setError(dict.common.networkError); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white";
  const units = ["م2", "م3", "م.ط", "طن", "كجم", "عدد", "حبة", "مقعد", "باب", "نافذة", "لفة", "علبة"];
  const categories = [
    { value: "", label: "اختر التصنيف" },
    { value: "CIVIL", label: dict.projects.boq.categories.CIVIL },
    { value: "ELECTRICAL", label: dict.projects.boq.categories.ELECTRICAL },
    { value: "MECHANICAL", label: dict.projects.boq.categories.MECHANICAL },
    { value: "FINISHING", label: dict.projects.boq.categories.FINISHING },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/dashboard/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-3">{dict.projects.backToList}</Link>
        <h1 className="text-2xl font-black text-[#0d2818]">{dict.projects.boq.newItem}</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.boq.code}</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="مثال: 01-001" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.boq.category}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {categories.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.boq.description} *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls + " resize-none"} rows={2} required />
        </div>
        <div className="grid md:grid-cols-4 gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.boq.unit}</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
              {units.map((u) => (<option key={u} value={u}>{u}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.boq.quantity}</label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} min="0" step="0.001" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.boq.unitPrice}</label>
            <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className={inputCls} min="0" step="0.01" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.boq.totalPrice}</label>
            <div className={inputCls + " bg-gray-100 text-gray-500 flex items-center"}>{totalPrice.toLocaleString("ar-SA", { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3"><p className="text-red-600 text-sm text-center">{error}</p></div>}
        <button type="submit" disabled={loading} className="w-full bg-[#1a5632] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#2d8a4e] transition-all shadow-xl shadow-[#1a5632]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />{dict.common.saving}</span> : dict.projects.boq.newItem}
        </button>
      </form>
    </div>
  );
}
