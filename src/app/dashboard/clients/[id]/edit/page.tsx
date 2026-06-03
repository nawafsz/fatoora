"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { dict, lang } = useLanguage();
  const locale = lang === "en" ? "en-US" : "ar-SA";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setEmail(data.email ?? "");
        setTaxNumber(data.taxNumber ?? "");
        setAddress(data.address ?? "");
      })
      .catch(() => setError(dict.clients.edit.loadError))
      .finally(() => setInitialLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, taxNumber, address }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? dict.common.error);
        return;
      }

      router.push("/dashboard/clients");
      router.refresh();
    } catch {
      setError(dict.common.networkError);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white";

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm animate-pulse">
          <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4" />
          <div className="h-4 bg-gray-100 rounded-lg w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/clients" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-3">
          {dict.clients.backToList}
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{dict.clients.edit.heading}</h1>
        <p className="text-gray-500 text-sm mt-1">{name}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.clients.edit.name}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.clients.edit.phone}</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.clients.edit.email}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.clients.edit.taxNumber}</label>
          <input type="text" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} className={inputCls + " font-mono"} dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.clients.edit.address}</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls + " resize-none"} rows={2} />
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
              {dict.clients.edit.loading}
            </span>
          ) : dict.clients.edit.submit}
        </button>
      </form>
    </div>
  );
}
