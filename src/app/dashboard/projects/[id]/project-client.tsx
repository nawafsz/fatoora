"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Dict } from "@/lib/i18n";

interface ProjectData {
  id: string;
  name: string;
  code: string | null;
  contractValue: number;
  retentionRate: number;
  advancePayment: number;
  progressClaims: Array<{
    id: string;
    claimNumber: number;
    completionPct: number;
    grossAmount: number;
    netCurrent: number;
    vatAmount: number;
    totalDue: number;
    status: string;
    periodStart: string;
    periodEnd: string;
    _count?: { boqSnapshots: number };
  }>;
  subcontracts: Array<{
    id: string;
    scope: string;
    contractValue: number;
    status: string;
    subcontractor: { name: string };
  }>;
  boqItems: Array<{
    id: string;
    code: string | null;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category: string | null;
    sortOrder: number;
  }>;
}

interface AssignedWorker {
  id: string;
  dailyRate: string | null;
  worker: {
    id: string;
    name: string;
    jobTitle: string | null;
    dailyRate: number;
    iqamaNumber: string | null;
  };
}

function formatSar(amount: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ProjectClient({
  project,
  dict,
  lang,
}: {
  project: ProjectData;
  dict: Dict;
  lang: string;
}) {
  const [activeTab, setActiveTab] = useState<"claims" | "subcontracts" | "boq" | "workers">("claims");
  const [workers, setWorkers] = useState<AssignedWorker[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);

  const locale = lang === "en" ? "en-US" : "ar-SA";

  useEffect(() => {
    if (activeTab === "workers") {
      setWorkersLoading(true);
      fetch(`/api/projects/${project.id}/workers`)
        .then((r) => r.json())
        .then((data) => setWorkers(Array.isArray(data) ? data : []))
        .catch(() => setWorkers([]))
        .finally(() => setWorkersLoading(false));
    }
  }, [activeTab, project.id]);

  const claimStatusCls: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    SUBMITTED: "bg-blue-100 text-blue-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
    PAID: "bg-green-100 text-green-700",
  };

  const tabs = [
    { key: "claims" as const, label: dict.projects.detail.progressClaims, count: project.progressClaims.length },
    { key: "subcontracts" as const, label: dict.projects.detail.subcontracts, count: project.subcontracts.length },
    { key: "boq" as const, label: dict.projects.detail.boq, count: project.boqItems.length },
    { key: "workers" as const, label: dict.projects.detail.workers, count: workers.length },
  ];

  return (
    <>
      {/* Tabs */}
      <div className="bg-white border border-gray-100 rounded-2xl p-1.5 shadow-sm flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? "bg-[#1a5632] text-white shadow-lg shadow-[#1a5632]/20"
                : "text-gray-400 hover:text-[#1a5632] hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span className={`mr-2 text-xs ${activeTab === tab.key ? "text-white/70" : "text-gray-300"}`}>
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {/* Claims Tab */}
      {activeTab === "claims" && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {project.progressClaims.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm">{dict.projects.detail.noClaims}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-right">
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">المستخلص</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">نسبة الإنجاز</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">إجمالي المطالبة</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">الحالة</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">الفترة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {project.progressClaims.map((c) => {
                  const sc = claimStatusCls[c.status] ?? "bg-gray-100 text-gray-600";
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-[#1a5632] font-bold text-sm">
                          {dict.projects.detail.progressClaims} #{c.claimNumber}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{Number(c.completionPct)}%</td>
                      <td className="px-5 py-4 text-sm font-bold text-[#0d2818]">{formatSar(Number(c.totalDue))}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${sc}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {new Date(c.periodStart).toLocaleDateString(locale)}
                        {" — "}
                        {new Date(c.periodEnd).toLocaleDateString(locale)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Subcontracts Tab */}
      {activeTab === "subcontracts" && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {project.subcontracts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm">{dict.projects.detail.noSubcontracts}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-right">
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">المقاول</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">نطاق العمل</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">قيمة العقد</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {project.subcontracts.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-semibold text-[#0d2818]">{s.subcontractor.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{s.scope}</td>
                    <td className="px-5 py-4 text-sm font-bold text-[#0d2818]">{formatSar(Number(s.contractValue))}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* BOQ Tab */}
      {activeTab === "boq" && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {project.boqItems.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm">{dict.projects.detail.noBoq}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-right">
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">الرمز</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">الوصف</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">الوحدة</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">الكمية</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">سعر الوحدة</th>
                  <th className="px-5 py-4 text-xs font-bold text-gray-400">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {project.boqItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-mono text-gray-400">{item.code || "—"}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#0d2818]">{item.description}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{item.unit}</td>
                    <td className="px-5 py-4 text-sm text-gray-600" dir="ltr">{Number(item.quantity).toLocaleString(locale)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{formatSar(Number(item.unitPrice))}</td>
                    <td className="px-5 py-4 text-sm font-bold text-[#0d2818]">{formatSar(Number(item.totalPrice))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-100">
                  <td colSpan={5} className="px-5 py-3 text-sm font-bold text-gray-500 text-left">
                    {dict.invoices.table.grandTotal}
                  </td>
                  <td className="px-5 py-3 text-sm font-black text-[#1a5632]">
                    {formatSar(project.boqItems.reduce((s, i) => s + Number(i.totalPrice), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* Workers Tab */}
      {activeTab === "workers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{dict.workers.attendance.noWorkers}</p>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/projects/${project.id}/attendance`}
                className="flex items-center gap-2 bg-[#1a5632] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20"
              >
                {dict.projects.detail.attendance}
              </Link>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {workersLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-[#1a5632]/30 border-t-[#1a5632] rounded-full animate-spin mx-auto" />
              </div>
            ) : workers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400 text-sm">{dict.workers.attendance.noWorkers}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-right">
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.name}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.jobTitle}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.iqamaNumber}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.dailyRate}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {workers.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/dashboard/workers/${a.worker.id}`} className="text-[#1a5632] font-bold text-sm hover:underline">
                          {a.worker.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{a.worker.jobTitle || "—"}</td>
                      <td className="px-5 py-4 text-sm text-gray-500 font-mono" dir="ltr">{a.worker.iqamaNumber || "—"}</td>
                      <td className="px-5 py-4 text-sm font-bold text-[#0d2818]" dir="ltr">
                        {formatSar(Number(a.dailyRate || a.worker.dailyRate))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </>
  );
}
