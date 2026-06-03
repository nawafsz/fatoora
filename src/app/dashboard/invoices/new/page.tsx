"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatSar } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

interface Client {
  id: string;
  name: string;
}

export default function NewInvoicePage() {
  const { dict, lang } = useLanguage();
  const locale = lang === "en" ? "en-US" : "ar-SA";
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState<"CASH" | "CREDIT">("CASH");
  const [items, setItems] = useState([{ name: "", quantity: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const taxAmount = subtotal * 0.15;
  const total = subtotal + taxAmount - discount;

  function addItem() {
    setItems([...items, { name: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: string | number) {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    setItems(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const validItems = items.filter((i) => i.name && i.quantity > 0);

    if (validItems.length === 0) {
      setError(dict.invoices.new.validation.minItem);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          type,
          items: validItems.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          subtotal,
          discount,
          taxAmount,
          total,
          ...(dueDate ? { dueDate } : {}),
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? dict.common.error);
        return;
      }

      const invoice = await res.json();
      router.push(`/dashboard/invoices/${invoice.id}`);
      router.refresh();
    } catch {
      setError(dict.common.networkError);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/invoices" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-3">
          {dict.invoices.backToList}
        </Link>
        <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{dict.invoices.new.heading}</h1>
        <p className="text-gray-500 text-sm mt-1">{dict.invoices.new.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Client & Type */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-[#0d2818] flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#1a5632]/10 flex items-center justify-center text-[#1a5632] text-sm">١</span>
            {dict.invoices.new.invoiceData}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.invoices.new.client}</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className={inputCls}
                required
              >
                <option value="">{dict.invoices.new.selectClient}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {clients.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {dict.invoices.new.noClients}{" "}
                  <Link href="/dashboard/clients/new" className="underline font-semibold">{dict.invoices.new.addClientFirst}</Link>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.invoices.new.invoiceType}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "CASH" | "CREDIT")}
                className={inputCls}
              >
                <option value="CASH">{dict.invoices.type.cash}</option>
                <option value="CREDIT">{dict.invoices.type.credit}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#0d2818] flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#1a5632]/10 flex items-center justify-center text-[#1a5632] text-sm">٢</span>
              {dict.invoices.table.items}
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-[#1a5632] font-bold hover:bg-[#1a5632]/5 px-3 py-1.5 rounded-lg transition-colors border border-[#1a5632]/20"
            >
              {dict.invoices.new.addProduct}
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-3 mb-3 text-xs font-bold text-gray-400 uppercase">
            <div className="col-span-5">{dict.invoices.table.product}</div>
            <div className="col-span-2 text-center">{dict.invoices.table.qty}</div>
            <div className="col-span-3 text-center">{dict.invoices.table.price}</div>
            <div className="col-span-2 text-left">{dict.invoices.table.total}</div>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center group">
                <div className="col-span-5">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                    className={inputCls}
                    placeholder={dict.invoices.new.productPlaceholder}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                    className={inputCls + " text-center"}
                    required
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                    className={inputCls}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1a5632] whitespace-nowrap">
                    {formatSar(item.quantity * item.unitPrice)}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-red-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-all"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discount + Due Date */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="font-bold text-[#0d2818] flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#1a5632]/10 flex items-center justify-center text-[#1a5632] text-sm">٣</span>
            {dict.invoices.new.discountAndDates}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.invoices.new.discountLabel}</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className={inputCls}
                placeholder="0.00"
              />
            </div>
            {type === "CREDIT" && (
              <div>
                <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.invoices.table.dueDate}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputCls}
                  dir="ltr"
                />
              </div>
            )}
          </div>
        </div>

        {/* Summary + Notes */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[#0d2818] flex items-center gap-2 mb-5">
            <span className="w-7 h-7 rounded-lg bg-[#1a5632]/10 flex items-center justify-center text-[#1a5632] text-sm">٤</span>
            {dict.invoices.new.summary}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.invoices.new.notes}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputCls + " resize-none"}
                rows={3}
                placeholder={dict.invoices.new.notesPlaceholder}
              />
            </div>
            <div className="bg-gray-50 rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{dict.invoices.table.subtotal}</span>
                <span className="font-semibold">{formatSar(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{dict.invoices.table.discount}</span>
                <span className="font-semibold text-red-500">-{formatSar(discount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{dict.invoices.new.taxLabel}</span>
                <span className="font-semibold">{formatSar(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-black border-t border-gray-200 pt-3 mt-1">
                <span className="text-[#0d2818]">{dict.invoices.table.grandTotal}</span>
                <span className="text-[#1a5632] text-xl">{formatSar(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !clientId}
          className="w-full bg-[#1a5632] text-white py-4 rounded-2xl font-black text-base hover:bg-[#2d8a4e] transition-all shadow-xl shadow-[#1a5632]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              {dict.invoices.new.loading}
            </span>
          ) : dict.invoices.new.submit}
        </button>
      </form>
    </div>
  );
}
