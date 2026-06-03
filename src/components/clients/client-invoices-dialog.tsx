"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatSar } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  date: string;
  total: string;
};

const statusConfig: Record<string, { cls: string }> = {
  DRAFT:     { cls: "bg-gray-100 text-gray-600" },
  SUBMITTED: { cls: "bg-emerald-100 text-emerald-700" },
  COMPLETED: { cls: "bg-emerald-200 text-emerald-800" },
  CANCELLED: { cls: "bg-red-100 text-red-700" },
  REPORTED:  { cls: "bg-blue-100 text-blue-700" },
};

export function ClientInvoicesDialog({
  client,
  onClose,
}: {
  client: Client;
  onClose: () => void;
}) {
  const { dict } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/clients/${client.id}/invoices`)
      .then((r) => r.json())
      .then((data) => {
        setInvoices(data.invoices ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [client.id]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const totalAmount = invoices.reduce((s, inv) => s + Number(inv.total), 0);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a5632]/10 flex items-center justify-center text-[#1a5632] font-bold">
              {client.name?.[0] ?? "؟"}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0d2818]">{client.name}</h2>
              <p className="text-xs text-gray-400">
                {client.phone && <span dir="ltr">{client.phone}</span>}
                {client.taxNumber && (
                  <span className="mr-2 font-mono" dir="ltr">
                    {dict.clients.dialog.taxPrefix} {client.taxNumber}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{dict.clients.dialog.invoiceCount}</p>
              <p className="text-xl font-black text-[#1a5632]">
                {invoices.length.toLocaleString("ar-SA")}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{dict.clients.dialog.totalAmount}</p>
              <p className="text-xl font-black text-blue-700">{formatSar(totalAmount)}</p>
            </div>
          </div>

          {/* Loading / Empty / Table */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">{dict.clients.dialog.loading}</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                📄
              </div>
              <p className="text-sm font-bold text-[#0d2818]">{dict.clients.dialog.noInvoices}</p>
              <Link
                href={`/dashboard/invoices/new?clientId=${client.id}`}
                className="inline-block mt-3 text-xs font-bold text-[#1a5632] hover:underline"
              >
                {dict.clients.dialog.createInvoice}
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-right">
                  <th className="px-4 py-3 text-xs font-bold text-gray-400">{dict.clients.dialog.table.invoiceNumber}</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400">{dict.clients.dialog.table.type}</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400">{dict.clients.dialog.table.amount}</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400">{dict.clients.dialog.table.date}</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400">{dict.clients.dialog.table.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => {
                  const sc = statusConfig[inv.status] ?? { cls: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/invoices/${inv.id}`}
                          className="text-[#1a5632] font-bold text-sm hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {dict.invoices.type[inv.type as keyof typeof dict.invoices.type] ?? inv.type}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-[#0d2818]">
                        {formatSar(Number(inv.total))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(inv.date).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${sc.cls}`}>
                          {dict.invoices.status[inv.status as keyof typeof dict.invoices.status] ?? inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
