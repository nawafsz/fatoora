import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatSar } from "@/lib/utils";
import { getTranslations } from "@/lib/i18n";
import { decryptSensitive } from "@/lib/encryption";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [settings, raw] = await Promise.all([
    db.settings.findUnique({ where: { userId: session.user.id }, select: { language: true } }),
    db.project.findMany({
      where: { userId: session.user.id },
      include: {
        client: { select: { name: true } },
        _count: {
          select: {
            progressClaims: true,
            subcontracts: true,
          },
        },
        progressClaims: {
          select: { totalDue: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const lang = settings?.language ?? "ar";
  const dict = await getTranslations(lang);
  const locale = lang === "en" ? "en-US" : "ar-SA";

  const projects = raw.map((p) => {
    const totalClaimed = p.progressClaims.reduce((sum, c) => sum + Number(c.totalDue), 0);
    const totalPaid = p.progressClaims
      .filter((c) => c.status === "PAID")
      .reduce((sum, c) => sum + Number(c.totalDue), 0);
    const completionPct =
      Number(p.contractValue) > 0
        ? Math.min((totalClaimed / Number(p.contractValue)) * 100, 100)
        : 0;
    return {
      ...p,
      client: p.client ? decryptSensitive(p.client as Record<string, unknown>, ["name"] as const) as typeof p.client : p.client,
      totalClaimed,
      totalPaid,
      completionPct: Math.round(completionPct * 10) / 10,
    };
  });

  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
  const totalValue = projects.reduce((sum, p) => sum + Number(p.contractValue), 0);
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{dict.projects.heading}</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} {dict.projects.subtitle}</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="flex items-center gap-2 bg-[#1a5632] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20 hover:-translate-y-0.5"
        >
          <span>+</span> {dict.projects.newProject}
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.status.ACTIVE}</p>
          <p className="text-2xl font-black text-[#1a5632]">{activeCount.toLocaleString(locale)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.status.COMPLETED}</p>
          <p className="text-2xl font-black text-blue-700">{completedCount.toLocaleString(locale)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.table.contractValue}</p>
          <p className="text-2xl font-black text-amber-700">{formatSar(totalValue)}</p>
        </div>
      </div>

      {/* Projects table */}
      {projects.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#1a5632]/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            🏗️
          </div>
          <p className="text-lg font-bold text-[#0d2818]">{dict.projects.emptyTitle}</p>
          <p className="text-gray-400 text-sm mt-2 mb-6">{dict.projects.emptyDesc}</p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 bg-[#1a5632] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20"
          >
            {dict.projects.emptyCta}
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-right">
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.projects.table.name}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.projects.table.client}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.projects.table.contractValue}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.projects.table.progress}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.projects.table.status}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wide">{dict.projects.table.claims}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map((p) => {
                const sc = statusColors[p.status] ?? "bg-gray-100 text-gray-600";
                const label = dict.projects.status[p.status as keyof typeof dict.projects.status] ?? p.status;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/projects/${p.id}`}
                        className="text-[#1a5632] font-bold text-sm hover:underline group-hover:text-[#2d8a4e]"
                      >
                        {p.code ? `${p.code} — ` : ""}{p.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{p.client.name}</td>
                    <td className="px-5 py-4 text-sm font-bold text-[#0d2818]" dir="ltr">{formatSar(Number(p.contractValue))}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1a5632] rounded-full transition-all"
                            style={{ width: `${p.completionPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-500 w-10 text-left" dir="ltr">{p.completionPct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${sc}`}>{label}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{p._count.progressClaims}</td>
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
