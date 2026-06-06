"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function EditBoqItemPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const itemId = params.itemId as string;
  const { dict } = useLanguage();

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("م2");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        const item = data.boqItems?.find((i: any) => i.id === itemId);
        if (item) {
          setCode(item.code ?? "");
          setDescription(item.description ?? "");
          setUnit(item.unit ?? "م2");
          setQuantity(String(item.quantity ?? ""));
          setUnitPrice(String(item.unitPrice ?? ""));
          setCategory(item.category ?? "");
        } else {
          setError("البند غير موجود");
        }
      })
      .catch(() => setError(dict.common.error))
      .finally(() => setInitialLoading(false));
  }, [projectId, itemId]);

  const totalPrice = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/boq/${itemId}`, {
        method: "PATCH",
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

  if (initialLoading) return <div className="max-w-3xl mx-auto"><div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm animate-pulse"><div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4" /><div className="h-4 bg-gray-100 rounded-lg w-32 mx-auto" /></div></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/dashboard/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-3">{dict.projects.backToList}</Link>
        <h1 className="text-2xl font-black text-[#0d2818]">{dict.projects.boq.heading}</h1>
        <p className="text-gray-500 text-sm">{description}</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.boq.code}</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.boq.category}</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              <option value="">اختر</option>
              {Object.entries(dict.projects.boq.categories as Record<string, string>).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.boq.description} *</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} required />
        </div>
        <div className="grid md:grid-cols-4 gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.boq.unit}</label>
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} />
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
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />{dict.common.saving}</span> : dict.common.save}
        </button>
      </form>
    </div>
  );
}
