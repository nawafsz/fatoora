import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

export default async function SubcontractDetailPage({
  params,
}: {
  params: Promise<{ id: string; subId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id, subId } = await params;

  const [settings, sub] = await Promise.all([
    db.settings.findUnique({ where: { userId: session.user.id }, select: { language: true } }),
    db.subcontract.findFirst({
      where: { id: subId, projectId: id },
      include: {
        project: { select: { name: true, contractValue: true } },
        subcontractor: { select: { name: true, taxNumber: true, phone: true } },
        claims: { orderBy: { claimNumber: "desc" } },
      },
    }),
  ]);

  if (!sub) notFound();

  const lang = settings?.language ?? "ar";
  const dict = await getTranslations(lang);

  const totalClaimed = sub.claims.reduce((s, c) => s + Number(c.totalDue), 0);
  const profitMargin = Number(sub.project.contractValue) > 0
    ? ((Number(sub.project.contractValue) - Number(sub.contractValue)) / Number(sub.project.contractValue)) * 100
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/projects/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-2">
            {dict.projects.subcontracts.backToProject}
          </Link>
          <h1 className="text-2xl font-black text-[#0d2818]">{sub.scope}</h1>
          <p className="text-gray-500 text-sm">{sub.subcontractor.name} — {sub.project.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/projects/${id}/subcontracts/${subId}/edit`} className="flex items-center gap-2 bg-white border-2 border-[#1a5632] text-[#1a5632] px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#1a5632] hover:text-white transition-all">
            {dict.common.edit}
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.subcontracts.contractValue}</p>
          <p className="text-2xl font-black text-[#1a5632]">{Number(sub.contractValue).toLocaleString("ar-SA")} ر.س</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.subcontracts.profitMargin}</p>
          <p className="text-2xl font-black text-blue-700">{Math.round(profitMargin)}%</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.subcontracts.claims}</p>
          <p className="text-2xl font-black text-amber-700">{sub.claims.length}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-black text-[#0d2818] mb-4">{dict.projects.subcontracts.claims}</h3>
        {sub.claims.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">{dict.projects.claims.notFound}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-right">
                <th className="px-4 py-3 text-xs font-bold text-gray-400">#</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400">{dict.projects.claims.completionPct}</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400">{dict.projects.claims.totalDue}</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400">{dict.projects.claims.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sub.claims.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-bold text-[#1a5632]">{c.claimNumber}</td>
                  <td className="px-4 py-3 text-sm">{Number(c.completionPct)}%</td>
                  <td className="px-4 py-3 text-sm font-bold">{Number(c.totalDue).toLocaleString("ar-SA")} ر.س</td>
                  <td className="px-4 py-3 text-sm">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
