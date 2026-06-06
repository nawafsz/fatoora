"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [allWorkers, setAllWorkers] = useState<Array<{ id: string; name: string; jobTitle: string | null }>>([]);
  const [showAssign, setShowAssign] = useState(false);
  const [assignWorkerId, setAssignWorkerId] = useState("");
  const [assignDailyRate, setAssignDailyRate] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  const router = useRouter();

  const loadWorkers = useCallback(async () => {
    setWorkersLoading(true);
    try {
      const [assignedRes, allRes] = await Promise.all([
        fetch(`/api/projects/${project.id}/workers`),
        fetch("/api/workers"),
      ]);
      const assigned = await assignedRes.json();
      const all = await allRes.json();
      setWorkers(Array.isArray(assigned) ? assigned : []);
      const allList = Array.isArray(all) ? all : [];
      const assignedIds = new Set((Array.isArray(assigned) ? assigned : []).map((a: AssignedWorker) => a.worker.id));
      setAllWorkers(allList.filter((w: { id: string }) => !assignedIds.has(w.id)).map((w: { id: string; name: string; jobTitle: string | null }) => ({ id: w.id, name: w.name, jobTitle: w.jobTitle })));
    } catch {
      setWorkers([]);
    } finally {
      setWorkersLoading(false);
    }
  }, [project.id]);

  const handleAssign = async () => {
    if (!assignWorkerId) return;
    setAssignLoading(true);
    setAssignError("");
    try {
      const res = await fetch(`/api/projects/${project.id}/workers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: assignWorkerId,
          dailyRate: assignDailyRate ? Number(assignDailyRate) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setAssignError(data.error ?? "فشل الإسناد");
        return;
      }
      setShowAssign(false);
      setAssignWorkerId("");
      setAssignDailyRate("");
      loadWorkers();
    } catch {
      setAssignError("فشل الاتصال");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveWorker = async (workerId: string) => {
    if (!confirm("هل أنت متأكد من إزالة هذا العامل من المشروع؟")) return;
    try {
      await fetch(`/api/projects/${project.id}/workers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, active: false }),
      });
      loadWorkers();
    } catch {}
  };

  const locale = lang === "en" ? "en-US" : "ar-SA";

  useEffect(() => {
    if (activeTab === "workers") loadWorkers();
  }, [activeTab, loadWorkers]);

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
      // Claims Tab
      {activeTab === "claims" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{project.progressClaims.length} {dict.projects.claims.heading}</p>
            <Link
              href={`/dashboard/projects/${project.id}/claims/new`}
              className="flex items-center gap-2 bg-[#1a5632] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20"
            >
              {dict.projects.detail.newClaim}
            </Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {project.progressClaims.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400 text-sm">{dict.projects.detail.noClaims}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-right">
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.claims.claimNumber}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.claims.completionPct}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.claims.totalDue}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.claims.status}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.claims.period}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {project.progressClaims.map((c) => {
                    const sc = claimStatusCls[c.status] ?? "bg-gray-100 text-gray-600";
                    const statusLabel = (
                      c.status === "DRAFT" ? dict.invoices.status.DRAFT :
                      c.status === "SUBMITTED" ? dict.invoices.status.SUBMITTED :
                      c.status === "APPROVED" ? "معتمد" :
                      c.status === "REJECTED" ? "مرفوض" :
                      c.status === "PAID" ? dict.invoices.status.COMPLETED :
                      c.status
                    );
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/projects/${project.id}/claims/${c.id}`)}>
                        <td className="px-5 py-4">
                          <span className="text-[#1a5632] font-bold text-sm">
                            #{c.claimNumber}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{Number(c.completionPct)}%</td>
                        <td className="px-5 py-4 text-sm font-bold text-[#0d2818]">{formatSar(Number(c.totalDue))}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${sc}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">
                          {new Date(c.periodStart).toLocaleDateString(locale)}
                          {" — "}
                          {new Date(c.periodEnd).toLocaleDateString(locale)}
                        </td>
                        <td className="px-5 py-4">
                          {c.status === "DRAFT" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("إرسال المستخلص إلى ZATCA؟")) {
                                  fetch(`/api/projects/${project.id}/claims/${c.id}/submit`, { method: "POST" })
                                    .then((r) => r.ok ? router.refresh() : alert("فشل الإرسال"));
                                }
                              }}
                              className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                            >
                              {dict.projects.claims.submitToZatca}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Subcontracts Tab */}
      {activeTab === "subcontracts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{project.subcontracts.length} عقد باطن</p>
            <Link
              href={`/dashboard/projects/${project.id}/subcontracts/new`}
              className="flex items-center gap-2 bg-[#1a5632] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20"
            >
              {dict.projects.detail.newSubcontract}
            </Link>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {project.subcontracts.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400 text-sm">{dict.projects.detail.noSubcontracts}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-right">
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.subcontracts.subcontractor}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.subcontracts.scope}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.subcontracts.contractValue}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.subcontracts.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {project.subcontracts.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/projects/${project.id}/subcontracts/${s.id}`)}>
                      <td className="px-5 py-4 text-sm font-semibold text-[#1a5632]">{s.subcontractor.name}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{s.scope}</td>
                      <td className="px-5 py-4 text-sm font-bold text-[#0d2818]">{formatSar(Number(s.contractValue))}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          s.status === "active" ? "bg-emerald-100 text-emerald-700" : s.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {(dict.projects.status as Record<string, string>)[s.status.toUpperCase()] || s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* BOQ Tab */}
      {activeTab === "boq" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{project.boqItems.length} {dict.projects.boq.heading}</p>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/projects/${project.id}/boq/print`}
                target="_blank"
                className="flex items-center gap-2 bg-white border-2 border-[#1a5632] text-[#1a5632] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#1a5632] hover:text-white transition-all"
              >
                🖨️ {dict.invoices.actions.printInvoice}
              </Link>
              <Link
                href={`/dashboard/projects/${project.id}/boq/new`}
                className="flex items-center gap-2 bg-[#1a5632] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20"
              >
                {dict.projects.detail.newBoqItem}
              </Link>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {project.boqItems.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400 text-sm">{dict.projects.boq.noItems}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-right">
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.boq.code}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.boq.description}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.boq.unit}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.boq.quantity}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.boq.unitPrice}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.projects.boq.totalPrice}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {project.boqItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/projects/${project.id}/boq/${item.id}/edit`)}>
                      <td className="px-5 py-4 text-sm font-mono text-gray-400">{item.code || "—"}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#0d2818]">{item.description}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{item.unit}</td>
                      <td className="px-5 py-4 text-sm text-gray-600" dir="ltr">{Number(item.quantity).toLocaleString(locale)}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{formatSar(Number(item.unitPrice))}</td>
                      <td className="px-5 py-4 text-sm font-bold text-[#0d2818]">{formatSar(Number(item.totalPrice))}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("حذف البند؟")) {
                              fetch(`/api/projects/${project.id}/boq/${item.id}`, { method: "DELETE" }).then(() => router.refresh());
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                        >
                          {dict.common.delete}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-100">
                    <td colSpan={6} className="px-5 py-3 text-sm font-bold text-gray-500 text-left">
                      {dict.projects.boq.grandTotal}
                    </td>
                    <td className="px-5 py-3 text-sm font-black text-[#1a5632]">
                      {formatSar(project.boqItems.reduce((s, i) => s + Number(i.totalPrice), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Workers Tab */}
      {activeTab === "workers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{workers.length} عامل مسند</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAssign(true)}
                className="flex items-center gap-2 bg-[#1a5632] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20"
              >
                + إسناد عامل
              </button>
              <Link
                href={`/dashboard/projects/${project.id}/attendance`}
                className="flex items-center gap-2 bg-white border-2 border-[#1a5632] text-[#1a5632] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#1a5632] hover:text-white transition-all"
              >
                {dict.projects.detail.attendance}
              </Link>
            </div>
          </div>

          {/* Assign Modal */}
          {showAssign && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAssign(false)}>
              <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-black text-[#0d2818] mb-4">إسناد عامل للمشروع</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#0d2818] mb-2">اختر العامل</label>
                    {allWorkers.length === 0 ? (
                      <p className="text-sm text-gray-400">جميع العمال مسندون لهذا المشروع</p>
                    ) : (
                      <select
                        value={assignWorkerId}
                        onChange={(e) => setAssignWorkerId(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 bg-gray-50"
                      >
                        <option value="">اختر عاملاً...</option>
                        {allWorkers.map((w) => (
                          <option key={w.id} value={w.id}>{w.name}{w.jobTitle ? ` — ${w.jobTitle}` : ""}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0d2818] mb-2">الأجر اليومي للمشروع (اختياري)</label>
                    <input
                      type="number"
                      value={assignDailyRate}
                      onChange={(e) => setAssignDailyRate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 bg-gray-50"
                      placeholder="اترك فارغاً لاستخدام الأجر الأساسي"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {assignError && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                      <p className="text-red-600 text-sm text-center">{assignError}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAssign}
                      disabled={assignLoading || !assignWorkerId}
                      className="flex-1 bg-[#1a5632] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all disabled:opacity-50"
                    >
                      {assignLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                          جاري الإسناد...
                        </span>
                      ) : "تأكيد الإسناد"}
                    </button>
                    <button
                      onClick={() => { setShowAssign(false); setAssignError(""); }}
                      className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workers table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {workersLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-[#1a5632]/30 border-t-[#1a5632] rounded-full animate-spin mx-auto" />
              </div>
            ) : workers.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400 text-sm">لا يوجد عمال مسندون بعد — اضف "+ إسناد عامل"</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-right">
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.name}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.jobTitle}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.iqamaNumber}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.dailyRate}</th>
                    <th className="px-5 py-4 text-xs font-bold text-gray-400"></th>
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
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleRemoveWorker(a.worker.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                        >
                          إزالة
                        </button>
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
