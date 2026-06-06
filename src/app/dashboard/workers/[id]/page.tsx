import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n";

export default async function WorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;

  const [settings, worker] = await Promise.all([
    db.settings.findUnique({ where: { userId: session.user.id }, select: { language: true } }),
    db.worker.findFirst({
      where: { id, userId: session.user.id },
      include: {
        assignments: {
          where: { active: true },
          include: { project: { select: { id: true, name: true } } },
        },
        attendance: { orderBy: { date: "desc" }, take: 30 },
      },
    }),
  ]);

  if (!worker) notFound();

  const lang = settings?.language ?? "ar";
  const dict = await getTranslations(lang);
  const locale = lang === "en" ? "en-US" : "ar-SA";

  const iqamaExpiring = worker.iqamaExpiry
    ? Math.ceil((new Date(worker.iqamaExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/workers" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-2">{dict.workers.backToList}</Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#0d2818]">{worker.name}</h1>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${worker.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
              {worker.active ? dict.workers.status.active : dict.workers.status.inactive}
            </span>
            {iqamaExpiring !== null && iqamaExpiring <= 60 && (
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${iqamaExpiring <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                {iqamaExpiring <= 0 ? dict.workers.detail.expired : `${dict.workers.detail.expireWarning} ${iqamaExpiring} ${dict.workers.detail.daysLeft}`}
              </span>
            )}
          </div>
        </div>
        <Link href={`/dashboard/workers/${id}/edit`} className="flex items-center gap-2 bg-white border-2 border-[#1a5632] text-[#1a5632] px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#1a5632] hover:text-white transition-all">{dict.common.edit}</Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-black text-[#0d2818] mb-4">{dict.workers.detail.personalInfo}</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-400">{dict.workers.table.iqamaNumber}</dt><dd className="font-semibold font-mono" dir="ltr">{worker.iqamaNumber || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-400">{dict.workers.table.jobTitle}</dt><dd className="font-semibold">{worker.jobTitle || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-400">{dict.workers.table.nationality}</dt><dd className="font-semibold">{worker.nationality || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-400">{dict.workers.table.dailyRate}</dt><dd className="font-semibold">{Number(worker.dailyRate).toLocaleString(locale)} ر.س</dd></div>
            <div className="flex justify-between"><dt className="text-gray-400">{dict.workers.detail.iqamaExpiry}</dt><dd className={`font-semibold ${iqamaExpiring !== null && iqamaExpiring <= 60 ? "text-red-600" : ""}`}>{worker.iqamaExpiry ? new Date(worker.iqamaExpiry).toLocaleDateString(locale) : "—"}</dd></div>
          </dl>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-black text-[#0d2818] mb-4">{dict.workers.detail.assignments} ({worker.assignments.length})</h3>
            {worker.assignments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">{dict.workers.detail.noAssignments}</p>
            ) : (
              <div className="space-y-2">
                {worker.assignments.map((a) => (
                  <Link key={a.id} href={`/dashboard/projects/${a.project.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <span className="text-sm font-semibold text-[#0d2818]">{a.project.name}</span>
                    <span className="text-xs text-gray-400">{a.dailyRate ? `${Number(a.dailyRate).toLocaleString(locale)} ر.س/يوم` : ""}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-black text-[#0d2818] mb-4">{dict.workers.detail.attendance} (آخر 30 يوم)</h3>
            {worker.attendance.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">{dict.workers.detail.noAttendance}</p>
            ) : (
              <table className="w-full">
                <thead><tr className="bg-gray-50 border-b border-gray-100 text-right"><th className="px-4 py-3 text-xs font-bold text-gray-400">{dict.workers.attendance.date}</th><th className="px-4 py-3 text-xs font-bold text-gray-400">{dict.workers.attendance.status}</th><th className="px-4 py-3 text-xs font-bold text-gray-400">{dict.workers.attendance.hoursExtra}</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {worker.attendance.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(a.date).toLocaleDateString(locale)}</td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{dict.workers.attendance[a.status.toLowerCase() as keyof typeof dict.workers.attendance] ?? a.status}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{Number(a.hoursExtra) > 0 ? `${a.hoursExtra} س` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
