import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string; claimId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id, claimId } = await params;

  const [settings, claim] = await Promise.all([
    db.settings.findUnique({ where: { userId: session.user.id }, select: { language: true } }),
    db.progressClaim.findFirst({
      where: { id: claimId, projectId: id },
      include: {
        project: { select: { name: true, code: true, contractValue: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
        boqSnapshots: {
          include: { boqItem: { select: { code: true, description: true, unit: true } } },
        },
      },
    }),
  ]);

  if (!claim) notFound();

  const lang = settings?.language ?? "ar";
  const dict = await getTranslations(lang);
  const locale = lang === "en" ? "en-US" : "ar-SA";

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    SUBMITTED: "bg-blue-100 text-blue-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
    PAID: "bg-green-100 text-green-700",
  };
  const statusLabel: Record<string, string> = {
    DRAFT: dict.invoices.status.DRAFT,
    SUBMITTED: dict.invoices.status.SUBMITTED,
    APPROVED: "معتمد",
    REJECTED: "مرفوض",
    PAID: dict.invoices.status.COMPLETED,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/projects/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-2">
            {dict.projects.subcontracts.backToProject}
          </Link>
          <h1 className="text-2xl font-black text-[#0d2818]">{dict.projects.claims.heading} #{claim.claimNumber}</h1>
          <p className="text-gray-500 text-sm">{claim.project.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${statusColors[claim.status] ?? "bg-gray-100 text-gray-600"}`}>
            {statusLabel[claim.status] ?? claim.status}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.claims.completionPct}</p>
          <p className="text-2xl font-black text-[#1a5632]">{Number(claim.completionPct)}%</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.claims.totalDue}</p>
          <p className="text-2xl font-black text-blue-700">{Number(claim.totalDue).toLocaleString(locale)} ر.س</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.claims.grossAmount}</p>
          <p className="text-2xl font-black text-amber-700">{Number(claim.grossAmount).toLocaleString(locale)} ر.س</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.claims.period}</p>
          <p className="text-lg font-black text-violet-700">
            {new Date(claim.periodStart).toLocaleDateString(locale)}
            {" — "}
            {new Date(claim.periodEnd).toLocaleDateString(locale)}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-black text-[#0d2818] mb-4">التفاصيل المالية</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-400">{dict.projects.claims.grossAmount}</dt>
              <dd className="font-semibold">{Number(claim.grossAmount).toLocaleString(locale)} ر.س</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">{dict.projects.claims.retentionAmt}</dt>
              <dd className="font-semibold text-red-600">-{Number(claim.retentionAmt).toLocaleString(locale)} ر.س</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">{dict.projects.claims.advanceDeduct}</dt>
              <dd className="font-semibold text-red-600">-{Number(claim.advanceDeduct).toLocaleString(locale)} ر.س</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">{dict.projects.claims.previousClaims}</dt>
              <dd className="font-semibold text-red-600">-{Number(claim.previousClaims).toLocaleString(locale)} ر.س</dd>
            </div>
            <div className="border-t border-gray-100 my-2" />
            <div className="flex justify-between">
              <dt className="text-gray-400">{dict.projects.claims.netCurrent}</dt>
              <dd className="font-bold text-[#0d2818]">{Number(claim.netCurrent).toLocaleString(locale)} ر.س</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">{dict.projects.claims.vatAmount}</dt>
              <dd className="font-semibold">{Number(claim.vatAmount).toLocaleString(locale)} ر.س</dd>
            </div>
            <div className="border-t border-gray-200" />
            <div className="flex justify-between">
              <dt className="text-base font-black text-gray-500">{dict.projects.claims.totalDue}</dt>
              <dd className="text-lg font-black text-[#1a5632]">{Number(claim.totalDue).toLocaleString(locale)} ر.س</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          {claim.invoice && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-black text-[#0d2818] mb-4">{dict.invoices.heading}</h3>
              <Link href={`/dashboard/invoices/${claim.invoice.id}`} className="text-[#1a5632] font-bold text-sm hover:underline">
                {claim.invoice.invoiceNumber} ←
              </Link>
            </div>
          )}

          {claim.notes && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-black text-[#0d2818] mb-2">{dict.invoices.table.notes}</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{claim.notes}</p>
            </div>
          )}

          {claim.boqSnapshots.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-black text-[#0d2818] mb-4">{dict.projects.boq.heading}</h3>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-right">
                    <th className="px-3 py-2 text-xs font-bold text-gray-400">{dict.projects.boq.code}</th>
                    <th className="px-3 py-2 text-xs font-bold text-gray-400">{dict.projects.boq.description}</th>
                    <th className="px-3 py-2 text-xs font-bold text-gray-400">{dict.projects.boq.unit}</th>
                    <th className="px-3 py-2 text-xs font-bold text-gray-400">{dict.projects.claims.claimNumber}</th>
                    <th className="px-3 py-2 text-xs font-bold text-gray-400">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {claim.boqSnapshots.map((s) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2 text-xs text-gray-400">{s.boqItem.code || "—"}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">{s.boqItem.description}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{s.boqItem.unit}</td>
                      <td className="px-3 py-2 text-sm font-semibold">{Number(s.qtyThisClaim).toLocaleString(locale)}</td>
                      <td className="px-3 py-2 text-sm font-bold text-[#0d2818]">{Number(s.amountClaimed).toLocaleString(locale)} ر.س</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
