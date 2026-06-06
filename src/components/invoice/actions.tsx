"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";

export function InvoiceActions({
  invoiceId,
  status,
  clientPhone,
  signedInvoice,
}: {
  invoiceId: string;
  status: string;
  clientPhone: string | null;
  signedInvoice?: string | null;
}) {
  const { dict } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitToZatca() {
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/submit`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? dict.invoices.actions.sendFailed);
        return;
      }
      setMessage(dict.invoices.actions.zatcaSuccess);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setMessage(dict.common.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelInvoice() {
    if (!confirm(dict.invoices.actions.confirmCancel)) return;
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/cancel`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? dict.invoices.actions.cancelFailed);
        return;
      }
      setMessage(dict.invoices.actions.cancelSuccess);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setMessage(dict.common.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  function printInvoice() {
    window.print();
  }

  async function sendWhatsApp() {
    setWaLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error ?? dict.invoices.actions.sendFailed);
        return;
      }
      setMessage(dict.invoices.actions.whatsappSuccess);
    } catch {
      setMessage(dict.common.networkError);
    } finally {
      setWaLoading(false);
    }
  }

  async function downloadQR() {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/qr`);
      const data = await res.json();
      const link = document.createElement("a");
      link.download = `QR-${invoiceId}.png`;
      link.href = data.qrCode;
      link.click();
    } catch {
      setMessage(dict.invoices.actions.qrFailed);
    }
  }

  async function downloadPdf() {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!res.ok) { setMessage(dict.invoices.actions.pdfFailed); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `INVOICE-${invoiceId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage(dict.invoices.actions.pdfFailed);
    }
  }

  const btnBase = "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-3">
      {status === "DRAFT" && (
        <button onClick={submitToZatca} disabled={submitting}
          className={`${btnBase} bg-[#1a5632] text-white hover:bg-[#2d8a4e] shadow-md shadow-[#1a5632]/20 hover:-translate-y-0.5`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {submitting ? dict.invoices.actions.submitting : dict.invoices.actions.submitToZatca}
        </button>
      )}

      {(status === "SUBMITTED" || status === "REPORTED") && (
        <button onClick={downloadPdf}
          className={`${btnBase} bg-white border-2 border-[#1a5632] text-[#1a5632] hover:bg-[#1a5632]/5`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          {dict.invoices.actions.downloadPdf}
        </button>
      )}

      <button onClick={printInvoice}
        className={`${btnBase} bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
        {dict.invoices.actions.printInvoice}
      </button>

      {clientPhone && (
        <button onClick={sendWhatsApp} disabled={waLoading}
          className={`${btnBase} bg-[#25D366] text-white hover:bg-[#1DA851] shadow-md shadow-[#25D366]/20 hover:-translate-y-0.5`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          {waLoading ? dict.invoices.actions.sendingWhatsApp : dict.invoices.actions.sendWhatsApp}
        </button>
      )}

      <button onClick={downloadQR}
        className={`${btnBase} bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
        {dict.invoices.actions.downloadQr}
      </button>

      {(status === "DRAFT" || status === "SUBMITTED") && (
        <button onClick={cancelInvoice} disabled={submitting}
          className={`${btnBase} bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 hover:border-red-300`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          {submitting ? dict.invoices.actions.cancelling : dict.invoices.actions.cancelInvoice}
        </button>
      )}

      {signedInvoice && (
        <button onClick={() => {
          try {
            const decoded = atob(signedInvoice);
            const win = window.open("", "_blank");
            if (win) {
              win.document.write(`<pre style="direction:ltr;text-align:left;font-size:12px;background:#f5f5f5;padding:20px;white-space:pre-wrap;word-break:break-word;">${decoded.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`);
              win.document.close();
            }
          } catch {
            setMessage("فشل فك الترميز");
          }
        }}
          className={`${btnBase} bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          {dict.invoices.actions.viewXml || "عرض XML الموقع"}
        </button>
      )}

      {message && (
        <p className={`text-xs text-center font-medium px-3 py-2 rounded-lg ${
          message.includes("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}
