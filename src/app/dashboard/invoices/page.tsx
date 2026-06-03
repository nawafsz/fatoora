import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatSar } from "@/lib/utils";
import { decryptString } from "@/lib/encryption";
import { getTranslations } from "@/lib/i18n";

export default async function InvoicesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [settings, raw] = await Promise.all([
    db.settings.findUnique({ where: { userId: session.user.id }, select: { language: true } }),
    db.invoice.findMany({
      where: { userId: session.user.id },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const lang = settings?.language ?? "ar";
  const dict = await getTranslations(lang);
  const locale = lang === "en" ? "en-US" : "ar-SA";

  const invoices = raw.map((inv) => {
    const clientName = inv.client.name.includes(":") ? decryptString(inv.client.name) : inv.client.name;
    return {
      ...inv,
      client: {
        ...inv.client,
        name: clientName,
        phone: inv.client.phone?.includes(":") ? decryptString(inv.client.phone) : inv.client.phone,
      },
    };
  });

  const statusCls: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    SUBMITTED: "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-emerald-200 text-emerald-800",
    CANCELLED: "bg-red-100 text-red-700",
    REPORTED: "bg-blue-100 text-blue-700",
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const completedCount = invoices.filter((inv) => inv.status === "COMPLETED" || inv.status === "SUBMITTED").length;
  const draftCount = invoices.filter((inv) => inv.status === "DRAFT").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{dict.invoices.heading}</h1>
          <p className="text-gray-500 text-sm mt-1">{invoices.length} {dict.invoices.totalInvoices}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/invoices/export"
            className="flex items-center gap-2 bg-white border-2 border-[#1a5632] text-[#1a5632] px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#1a5632] hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {dict.invoices.exportExcel}
          </a>
          <Link
            href="/dashboard/invoices/new"
            className="flex items-center gap-2 bg-[#1a5632] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20 hover:-translate-y-0.5"
          >
            <span>+</span> {dict.invoices.newInvoice}
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.invoices.summaryTotal}</p>
          <p className="text-2xl font-black text-[#1a5632]">{formatSar(totalAmount)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.invoices.summaryCompleted}</p>
          <p className="text-2xl font-black text-emerald-700">{completedCount.toLocaleString(locale)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.invoices.summaryDrafts}</p>
          <p className="text-2xl font-black text-amber-700">{draftCount.toLocaleString(locale)}</p>
        </div>
      </div>

      {/* Invoices table */}
      {invoices.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#1a5632]/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            📄
          </div>
          <p className="text-lg font-bold text-[#0d2818]">{dict.invoices.emptyTitle}</p>
          <p className="text-gray-400 text-sm mt-2 mb-6">{dict.invoices.emptyDesc}</p>
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center gap-2 bg-[#1a5632] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20"
          >
            {dict.invoices.emptyCta}
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-right">
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.invoices.table.number}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.invoices.table.client}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.invoices.table.amount}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.invoices.table.date}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.invoices.table.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((inv) => {
                const sc = statusCls[inv.status] ?? "bg-gray-100 text-gray-600";
                const label = dict.invoices.status[inv.status as keyof typeof dict.invoices.status] ?? inv.status;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="text-[#1a5632] font-bold text-sm hover:underline group-hover:text-[#2d8a4e]"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{inv.client.name}</td>
                    <td className="px-5 py-4 text-sm font-bold text-[#0d2818]">{formatSar(Number(inv.total))}</td>
                    <td className="px-5 py-4 text-sm text-gray-400">
                      {new Date(inv.date).toLocaleDateString(locale)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${sc}`}>
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
