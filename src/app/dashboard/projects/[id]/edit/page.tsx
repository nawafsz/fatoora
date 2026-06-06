"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { dict } = useLanguage();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [clientId, setClientId] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [advancePayment, setAdvancePayment] = useState("0");
  const [retentionRate, setRetentionRate] = useState("10");
  const [taxRate, setTaxRate] = useState("15");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [notes, setNotes] = useState("");
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch(`/api/projects/${id}`).then((r) => r.json()),
    ])
      .then(([clientsData, projectData]) => {
        if (Array.isArray(clientsData)) setClients(clientsData);
        if (projectData.error) {
          setError(projectData.error);
          return;
        }
        setName(projectData.name ?? "");
        setCode(projectData.code ?? "");
        setDescription(projectData.description ?? "");
        setLocation(projectData.location ?? "");
        setClientId(projectData.clientId ?? "");
        setContractValue(String(projectData.contractValue ?? ""));
        setAdvancePayment(String(projectData.advancePayment ?? "0"));
        setRetentionRate(String(projectData.retentionRate ?? "10"));
        setTaxRate(String(projectData.taxRate ?? "15"));
        setStartDate(projectData.startDate ? projectData.startDate.slice(0, 10) : "");
        setEndDate(projectData.endDate ? projectData.endDate.slice(0, 10) : "");
        setStatus(projectData.status ?? "ACTIVE");
        setNotes(projectData.notes ?? "");
      })
      .catch(() => setError(dict.common.error))
      .finally(() => setInitialLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code: code || undefined,
          description: description || undefined,
          location: location || undefined,
          clientId,
          contractValue: Number(contractValue),
          advancePayment: Number(advancePayment),
          retentionRate: Number(retentionRate),
          taxRate: Number(taxRate),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? dict.common.error);
        return;
      }

      router.push(`/dashboard/projects/${id}`);
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
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm animate-pulse">
          <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4" />
          <div className="h-4 bg-gray-100 rounded-lg w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href={`/dashboard/projects/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-3"
        >
          {dict.projects.backToList}
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{dict.projects.edit.heading}</h1>
        <p className="text-gray-500 text-sm mt-1">{name}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.name}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.code}</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.location}</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.description}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls + " resize-none"} rows={2} />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.client}</label>
          {clients.length === 0 ? (
            <p className="text-sm text-gray-400">{dict.projects.new.noClients}</p>
          ) : (
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputCls} required>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.contractValue}</label>
            <input type="number" value={contractValue} onChange={(e) => setContractValue(e.target.value)} className={inputCls} min="0" step="0.01" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.advancePayment}</label>
            <input type="number" value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value)} className={inputCls} min="0" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.retentionRate}</label>
            <input type="number" value={retentionRate} onChange={(e) => setRetentionRate(e.target.value)} className={inputCls} min="0" max="100" step="0.01" />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.taxRate}</label>
            <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputCls} min="0" max="100" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.startDate}</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.endDate}</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.status}</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="ACTIVE">{dict.projects.status.ACTIVE}</option>
              <option value="ON_HOLD">{dict.projects.status.ON_HOLD}</option>
              <option value="COMPLETED">{dict.projects.status.COMPLETED}</option>
              <option value="CANCELLED">{dict.projects.status.CANCELLED}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.projects.edit.notes}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls + " resize-none"} rows={2} />
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
              {dict.projects.edit.loading}
            </span>
          ) : dict.projects.edit.submit}
        </button>
      </form>
    </div>
  );
}
