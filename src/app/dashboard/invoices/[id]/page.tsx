import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatSar } from "@/lib/utils";
import { decryptString } from "@/lib/encryption";
import { InvoiceActions } from "@/components/invoice/actions";
import { getTranslations } from "@/lib/i18n";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const settings = await db.settings.findUnique({
    where: { userId: session.user.id },
    select: { language: true },
  });
  const dict = await getTranslations(settings?.language ?? "ar");
  const locale = settings?.language === "en" ? "en-US" : "ar-SA";

  const { id } = await params;

  const invoice = await db.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: { client: true },
  });

  if (!invoice) notFound();

  const client = {
    ...invoice.client,
    name: invoice.client.name.includes(":") ? decryptString(invoice.client.name) : invoice.client.name,
    phone: invoice.client.phone?.includes(":") ? decryptString(invoice.client.phone) : invoice.client.phone,
  };

  const statusConfig: Record<string, { label: string; cls: string; dot: string }> = {
    DRAFT:      { label: dict.invoices.status.DRAFT,      cls: "bg-gray-100 text-gray-600",          dot: "bg-gray-400" },
    SUBMITTED:  { label: dict.invoices.status.SUBMITTED,  cls: "bg-emerald-100 text-emerald-700",    dot: "bg-emerald-500" },
    COMPLETED:  { label: dict.invoices.status.COMPLETED,  cls: "bg-emerald-200 text-emerald-800",    dot: "bg-emerald-600" },
    CANCELLED:  { label: dict.invoices.status.CANCELLED,  cls: "bg-red-100 text-red-700",            dot: "bg-red-500" },
    REPORTED:   { label: dict.invoices.status.REPORTED,   cls: "bg-blue-100 text-blue-700",          dot: "bg-blue-500" },
  };

  const sc = statusConfig[invoice.status] ?? { label: invoice.status, cls: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="no-print">
        <Link href="/dashboard/invoices" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-3">
          {dict.invoices.backToList}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{invoice.invoiceNumber}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {new Date(invoice.date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold ${sc.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
              {invoice.type === "CASH" ? dict.invoices.type.CASH : dict.invoices.type.CREDIT}
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Main invoice card */}
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden print-area">
          {/* Invoice header bar */}
          <div className="print-header bg-gradient-to-l from-[#0d2818] to-[#1a5632] px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-black text-lg">
                {dict.brand.logo}
              </div>
              <div>
                <p className="text-white font-black text-lg">{dict.invoices.detail.heading}</p>
                <p className="text-green-200 text-xs">{dict.invoices.detail.subtitle}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-white font-bold">{invoice.invoiceNumber}</p>
              <p className="text-green-200 text-xs">{new Date(invoice.date).toLocaleDateString(locale)}</p>
            </div>
          </div>

          <div className="p-8">
            {/* Client info */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">{dict.invoices.detail.billTo}</p>
              <p className="text-lg font-black text-[#0d2818]">{client.name}</p>
              {client.taxNumber && (
                <p className="text-sm text-gray-500 mt-1" dir="ltr">{dict.invoices.detail.taxNumber} {client.taxNumber}</p>
              )}
              {client.phone && (
                <p className="text-sm text-gray-500 mt-0.5" dir="ltr">{client.phone}</p>
              )}
            </div>

            {/* Items table */}
            <table className="w-full mb-6">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="pb-3 text-xs font-bold text-gray-400 text-right uppercase">{dict.invoices.table.product}</th>
                  <th className="pb-3 text-xs font-bold text-gray-400 text-center uppercase">{dict.invoices.table.qty}</th>
                  <th className="pb-3 text-xs font-bold text-gray-400 text-center uppercase">{dict.invoices.table.price}</th>
                  <th className="pb-3 text-xs font-bold text-gray-400 text-left uppercase">{dict.invoices.table.total}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items as string) ?? []).map(
                  (item: { name: string; quantity: number; unitPrice: number }, idx: number) => (
                    <tr key={idx}>
                      <td className="py-3 text-sm font-medium text-[#0d2818]">{item.name}</td>
                      <td className="py-3 text-sm text-center text-gray-500">{item.quantity}</td>
                      <td className="py-3 text-sm text-center text-gray-500">{formatSar(item.unitPrice)}</td>
                      <td className="py-3 text-sm text-left font-bold text-[#0d2818]">
                        {formatSar(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            {/* Totals */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-5 mr-auto w-64 space-y-2.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{dict.invoices.table.subtotal}</span>
                <span className="font-semibold">{formatSar(Number(invoice.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{dict.invoices.new.taxLabel}</span>
                <span className="font-semibold">{formatSar(Number(invoice.taxAmount))}</span>
              </div>
              <div className="flex justify-between text-lg font-black border-t-2 border-gray-200 pt-2.5 mt-1">
                <span className="text-[#0d2818]">{dict.invoices.table.grandTotal}</span>
                <span className="text-[#1a5632] text-xl">{formatSar(Number(invoice.total))}</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">{dict.invoices.table.notes}</p>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 no-print">
          {/* Actions card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-[#0d2818] mb-4 flex items-center gap-2">
              <span className="text-lg">⚡</span> {dict.invoices.detail.actions}
            </h3>
            <InvoiceActions
              invoiceId={invoice.id}
              status={invoice.status}
              clientPhone={client.phone}
            />
            {invoice.status === "DRAFT" && (
              <Link
                href={`/dashboard/invoices/${invoice.id}/edit`}
                className="mt-4 flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
              >
                ✏️ {dict.invoices.edit.heading}
              </Link>
            )}
          </div>

          {/* QR code card */}
          {invoice.qrCode && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-center">
              <h3 className="font-bold text-[#0d2818] mb-4 flex items-center justify-center gap-2">
                <span>🔐</span> {dict.invoices.detail.qrHeading}
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 inline-block">
                <img
                  src={invoice.qrCode}
                  alt={dict.invoices.detail.qrHeading}
                  className="mx-auto w-36 h-36"
                />
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {dict.invoices.detail.qrHint}
              </p>
            </div>
          )}

          {/* ZATCA status */}
          <div className={`rounded-2xl p-5 border ${
            invoice.status === "COMPLETED" || invoice.status === "SUBMITTED"
              ? "bg-emerald-50 border-emerald-100"
              : "bg-gray-50 border-gray-100"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{invoice.status === "COMPLETED" || invoice.status === "SUBMITTED" ? "✅" : "⏳"}</span>
              <div>
                <p className="text-sm font-bold text-[#0d2818]">
                  {invoice.status === "COMPLETED" || invoice.status === "SUBMITTED" ? dict.invoices.detail.zatcaRecorded : dict.invoices.detail.zatcaPending}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {invoice.status === "COMPLETED" || invoice.status === "SUBMITTED"
                    ? dict.invoices.detail.zatcaSigned
                    : dict.invoices.detail.zatcaPrompt
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
