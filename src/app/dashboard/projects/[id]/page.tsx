import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatSar } from "@/lib/utils";
import { getTranslations } from "@/lib/i18n";
import { ProjectClient } from "./project-client";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;

  const [settings, project] = await Promise.all([
    db.settings.findUnique({ where: { userId: session.user.id }, select: { language: true } }),
    db.project.findFirst({
      where: { id, userId: session.user.id },
      include: {
        client: { select: { id: true, name: true, taxNumber: true, phone: true } },
        progressClaims: {
          orderBy: { claimNumber: "desc" },
          include: {
            _count: { select: { boqSnapshots: true } },
          },
        },
        subcontracts: {
          include: {
            subcontractor: { select: { name: true } },
          },
        },
        boqItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ]);

  if (!project) notFound();

  const serialized = JSON.parse(JSON.stringify(project));

  const lang = settings?.language ?? "ar";
  const dict = await getTranslations(lang);
  const locale = lang === "en" ? "en-US" : "ar-SA";

  const totalClaimed = project.progressClaims.reduce((sum, c) => sum + Number(c.totalDue), 0);
  const totalPaid = project.progressClaims
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + Number(c.totalDue), 0);
  const completionPct =
    Number(project.contractValue) > 0
      ? Math.min((totalClaimed / Number(project.contractValue)) * 100, 100)
      : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-2"
          >
            {dict.projects.backToList}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">
              {project.code ? `${project.code} — ` : ""}{project.name}
            </h1>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColors[project.status]}`}>
              {dict.projects.status[project.status as keyof typeof dict.projects.status] ?? project.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/projects/${id}/edit`}
            className="flex items-center gap-2 bg-white border-2 border-[#1a5632] text-[#1a5632] px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#1a5632] hover:text-white transition-all"
          >
            {dict.common.edit}
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.detail.completionPct}</p>
          <p className="text-2xl font-black text-[#1a5632]">{Math.round(completionPct)}%</p>
          <div className="mt-2 h-2 bg-white/60 rounded-full overflow-hidden">
            <div className="h-full bg-[#1a5632] rounded-full" style={{ width: `${completionPct}%` }} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.detail.totalClaimed}</p>
          <p className="text-2xl font-black text-blue-700">{formatSar(totalClaimed)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.detail.totalPaid}</p>
          <p className="text-2xl font-black text-amber-700">{formatSar(totalPaid)}</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 mb-1">{dict.projects.table.contractValue}</p>
          <p className="text-2xl font-black text-violet-700">{formatSar(Number(project.contractValue))}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Contract Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-black text-[#0d2818] mb-4">{dict.projects.detail.contractInfo}</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-400">{dict.projects.detail.retentionRate}</dt>
                <dd className="font-semibold text-[#0d2818]">{Number(project.retentionRate)}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">{dict.projects.detail.advancePayment}</dt>
                <dd className="font-semibold text-[#0d2818]" dir="ltr">{formatSar(Number(project.advancePayment))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">{dict.projects.detail.location}</dt>
                <dd className="font-semibold text-[#0d2818]">{project.location || "—"}</dd>
              </div>
              {(project.startDate || project.endDate) && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">{dict.projects.detail.period}</dt>
                  <dd className="font-semibold text-[#0d2818] text-left" dir="ltr">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString(locale) : "?"}
                    {" — "}
                    {project.endDate ? new Date(project.endDate).toLocaleDateString(locale) : "?"}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-black text-[#0d2818] mb-4">{dict.projects.detail.clientInfo}</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-400 mb-1">{dict.projects.table.client}</dt>
                <dd className="font-semibold text-[#0d2818]">{project.client.name}</dd>
              </div>
              {project.client.taxNumber && (
                <div>
                  <dt className="text-gray-400 mb-1">الرقم الضريبي</dt>
                  <dd className="font-semibold text-[#0d2818] font-mono" dir="ltr">{project.client.taxNumber}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Right: Tabs content */}
        <div className="md:col-span-2 space-y-6">
          <ProjectClient project={serialized} dict={dict} lang={lang} />
        </div>
      </div>
    </div>
  );
}
