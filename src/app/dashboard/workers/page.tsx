import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n";

export default async function WorkersPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const [settings, workers] = await Promise.all([
    db.settings.findUnique({ where: { userId: session.user.id }, select: { language: true } }),
    db.worker.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { assignments: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const lang = settings?.language ?? "ar";
  const dict = await getTranslations(lang);
  const locale = lang === "en" ? "en-US" : "ar-SA";

  const activeCount = workers.filter((w) => w.active).length;
  const expiredIqama = workers.filter((w) => w.iqamaExpiry && new Date(w.iqamaExpiry) < new Date()).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{dict.workers.heading}</h1>
          <p className="text-gray-500 text-sm mt-1">{workers.length} {dict.workers.subtitle}</p>
        </div>
        <Link href="/dashboard/workers/new" className="flex items-center gap-2 bg-[#1a5632] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20 hover:-translate-y-0.5">
          <span>+</span> {dict.workers.newWorker}
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.workers.status.active}</p>
          <p className="text-2xl font-black text-[#1a5632]">{activeCount.toLocaleString(locale)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.workers.status.inactive}</p>
          <p className="text-2xl font-black text-amber-700">{(workers.length - activeCount).toLocaleString(locale)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.workers.detail.expired}</p>
          <p className="text-2xl font-black text-red-700">{expiredIqama.toLocaleString(locale)}</p>
        </div>
      </div>

      {workers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-20 text-center shadow-sm">
          <div className="w-16 h-16 bg-[#1a5632]/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">👷</div>
          <p className="text-lg font-bold text-[#0d2818]">{dict.workers.emptyTitle}</p>
          <p className="text-gray-400 text-sm mt-2 mb-6">{dict.workers.emptyDesc}</p>
          <Link href="/dashboard/workers/new" className="inline-flex items-center gap-2 bg-[#1a5632] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20">{dict.workers.emptyCta}</Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-right">
                <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.name}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.iqamaNumber}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.jobTitle}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.dailyRate}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.projectCount}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workers.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/workers/${w.id}`} className="text-[#1a5632] font-bold text-sm hover:underline">{w.name}</Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 font-mono" dir="ltr">{w.iqamaNumber || "—"}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{w.jobTitle || "—"}</td>
                  <td className="px-5 py-4 text-sm font-bold text-[#0d2818]" dir="ltr">{Number(w.dailyRate).toLocaleString(locale)} ر.س</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{w._count.assignments}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${w.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {w.active ? dict.workers.status.active : dict.workers.status.inactive}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
