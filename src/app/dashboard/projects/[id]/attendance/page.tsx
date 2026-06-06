"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "OVERTIME" | "VACATION";

interface Worker {
  id: string;
  name: string;
  jobTitle: string | null;
  dailyRate: number;
  iqamaNumber: string | null;
}

interface AssignedWorker {
  id: string;
  dailyRate: string | null;
  worker: Worker;
}

interface AttendanceRecord {
  id?: string;
  workerId: string;
  status: AttendanceStatus;
  hoursExtra: number;
  notes: string | null;
}

const statusList: AttendanceStatus[] = ["PRESENT", "ABSENT", "HALF_DAY", "OVERTIME", "VACATION"];

const statusColors: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ABSENT: "bg-red-100 text-red-700 border-red-200",
  HALF_DAY: "bg-amber-100 text-amber-700 border-amber-200",
  OVERTIME: "bg-blue-100 text-blue-700 border-blue-200",
  VACATION: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function AttendancePage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const { dict } = useLanguage();

  const [workers, setWorkers] = useState<AssignedWorker[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const [workersRes, attRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/workers`),
        fetch(`/api/attendance?projectId=${projectId}&date=${date}`),
      ]);
      const workersData = await workersRes.json();
      const attData = await attRes.json();

      setWorkers(Array.isArray(workersData) ? workersData : []);

      const recordMap: Record<string, AttendanceRecord> = {};
      if (Array.isArray(attData)) {
        for (const r of attData) {
          recordMap[r.workerId] = {
            id: r.id,
            workerId: r.workerId,
            status: r.status as AttendanceStatus,
            hoursExtra: Number(r.hoursExtra ?? 0),
            notes: r.notes,
          };
        }
      }
      // Set defaults for workers without records
      for (const w of workersData) {
        if (!recordMap[w.worker.id]) {
          recordMap[w.worker.id] = {
            workerId: w.worker.id,
            status: "PRESENT",
            hoursExtra: 0,
            notes: null,
          };
        }
      }
      setRecords(recordMap);
    } catch {
      setMessage("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [projectId, date]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  function updateRecord(workerId: string, field: keyof AttendanceRecord, value: AttendanceStatus | number | string | null) {
    setRecords((prev) => ({
      ...prev,
      [workerId]: { ...prev[workerId] ?? { workerId, status: "PRESENT" as AttendanceStatus, hoursExtra: 0, notes: null }, [field]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const recordsArray = Object.values(records).filter(Boolean).map((r) => ({
        workerId: r.workerId,
        status: r.status,
        hoursExtra: r.status === "OVERTIME" ? r.hoursExtra : 0,
        notes: r.notes,
      }));

      const res = await fetch("/api/attendance/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, date, records: recordsArray }),
      });

      if (!res.ok) throw new Error();
      setMessage(dict.workers.attendance.saveSuccess);
      setTimeout(() => setMessage(""), 3000);
      router.refresh();
    } catch {
      setMessage(dict.common.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#1a5632] transition-colors mb-2">
            {dict.projects.backToList}
          </Link>
          <h1 className="text-2xl font-black text-[#0d2818]">{dict.workers.attendance.heading}</h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#1a5632] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20 disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : null}
            {dict.workers.attendance.batchSave}
          </button>
        </div>
      </div>

      {message && (
        <div className={`rounded-2xl px-5 py-3 text-sm font-semibold text-center ${message.includes("✅") || message.includes("success") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-100"}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-20 text-center shadow-sm">
          <div className="w-10 h-10 border-2 border-[#1a5632]/20 border-t-[#1a5632] rounded-full animate-spin mx-auto" />
        </div>
      ) : workers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-20 text-center shadow-sm">
          <p className="text-gray-400 text-sm">{dict.workers.attendance.noWorkers}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-right">
                <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.name}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.table.jobTitle}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.attendance.status}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.attendance.hoursExtra}</th>
                <th className="px-5 py-4 text-xs font-bold text-gray-400">{dict.workers.attendance.notes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workers.map((a) => {
                const record = records[a.worker.id] ?? { workerId: a.worker.id, status: "PRESENT" as AttendanceStatus, hoursExtra: 0, notes: null };
                return (
                  <tr key={a.worker.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold text-[#0d2818]">{a.worker.name}</span>
                      {a.worker.iqamaNumber && (
                        <span className="text-xs text-gray-400 mr-2 font-mono" dir="ltr">({a.worker.iqamaNumber})</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{a.worker.jobTitle || "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {statusList.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateRecord(a.worker.id, "status", s)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all ${
                              record.status === s
                                ? statusColors[s]
                                : "border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600"
                            }`}
                          >
                            {dict.workers.attendance[s.toLowerCase() as keyof typeof dict.workers.attendance] ?? s}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="number"
                        value={record.hoursExtra}
                        onChange={(e) => updateRecord(a.worker.id, "hoursExtra", Number(e.target.value))}
                        className={`w-20 border rounded-lg px-2 py-1.5 text-sm text-center ${
                          record.status === "OVERTIME"
                            ? "border-blue-200 bg-blue-50 text-blue-700 font-semibold"
                            : "border-gray-100 bg-gray-50 text-gray-400"
                        } focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20`}
                        min="0"
                        step="0.5"
                        dir="ltr"
                        disabled={record.status !== "OVERTIME"}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={record.notes ?? ""}
                        onChange={(e) => updateRecord(a.worker.id, "notes", e.target.value || null)}
                        className="w-28 border border-gray-100 rounded-lg px-2 py-1.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20"
                        placeholder="..."
                      />
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
