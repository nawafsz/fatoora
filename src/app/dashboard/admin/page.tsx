"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

type SubInfo = {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
} | null;

type User = {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  role: string;
  active: boolean;
  createdAt: string;
  subscriptions: SubInfo[];
};

type Stats = {
  totalUsers: number;
  totalInvoices: number;
  totalRevenue: number;
  planCounts: { plan: string; _count: number }[];
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { dict, lang } = useLanguage();
  const a = dict.admin;
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  const load = () => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/stats").then((r) => r.json()),
    ]).then(([usersData, statsData]) => {
      setUsers(usersData);
      setStats(statsData);
    });
  };

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status]);

  const toggleActive = async (userId: string, current: boolean) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !current }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: !current } : u)));
      if (selected?.id === userId) setSelected({ ...selected, active: !current });
      setToast(current ? a.deactivate : a.activate);
      setTimeout(() => setToast(""), 3000);
    }
  };

  const deleteUser = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelected(null);
      setConfirmDelete(null);
      setToast(a.delete);
      setTimeout(() => setToast(""), 3000);
      load();
    }
  };

  if (status === "loading") return <div className="text-center py-20 text-gray-400">{dict.common.loading}</div>;

  const sub = selected?.subscriptions?.[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8" dir={lang === "en" ? "ltr" : "rtl"}>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1a5632] text-white px-6 py-3 rounded-xl shadow-lg text-sm font-bold">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
        <Link href="/dashboard/admin" className="bg-[#1a5632] text-white px-4 py-2 rounded-lg text-sm font-bold">{a.navAdmin}</Link>
        <Link href="/dashboard/admin/tickets" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100">{a.navTickets}</Link>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{a.title}</h1>
        <p className="text-gray-500 text-sm mt-1">{a.sub}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{a.statsUsers}</p>
            <p className="text-2xl font-black text-[#1a5632]">{stats.totalUsers.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{a.statsInvoices}</p>
            <p className="text-2xl font-black text-[#1a5632]">{stats.totalInvoices.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{a.statsRevenue}</p>
            <p className="text-2xl font-black text-[#1a5632]">{stats.totalRevenue.toLocaleString()} {dict.dashboard.home.currency}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{a.statsPlans}</p>
            <div className="text-xs space-y-1 mt-1">
              {stats.planCounts.map((p: { plan: string; _count: number }) => (
                <div key={p.plan} className="flex justify-between">
                  <span className="text-gray-500">{p.plan}</span>
                  <span className="font-bold text-[#0d2818]">{p._count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#0d2818]">{a.usersTitle}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-right">
                <th className="px-5 py-3 text-xs font-bold text-gray-400">{a.name}</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-400">{a.email}</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-400">{a.plan}</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-400">{a.statusCol}</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-400">{a.role}</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-400">{a.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <button onClick={() => setSelected(u)} className="text-sm font-semibold text-[#1a5632] hover:underline">
                      {u.name || a.na}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">{u.plan}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.active ? a.active : a.inactive}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm">{u.role === "admin" ? <span className="text-amber-600 font-bold">{a.admin}</span> : <span className="text-gray-400">{a.user}</span>}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(u.id, u.active)}
                        className={`text-xs px-2 py-1 rounded-lg font-bold transition-all ${u.active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                      >
                        {u.active ? a.deactivate : a.activate}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(u.id)}
                        className="text-xs px-2 py-1 rounded-lg font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                      >
                        {a.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#0d2818]">{selected.name || a.na}</h2>
                <p className="text-sm text-gray-500">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-xs font-bold text-gray-500 mb-2">{a.subInfo}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{a.subPlan}</span>
                    <span className="font-bold text-[#0d2818]">{selected.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{a.subStart}</span>
                    <span className="font-semibold">{sub?.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString(lang === "en" ? "en-US" : "ar-SA") : a.na}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{a.subEnd}</span>
                    <span className="font-semibold">{sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString(lang === "en" ? "en-US" : "ar-SA") : a.na}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{a.subStatus}</span>
                    <span className={`font-semibold ${sub?.status === "active" ? "text-green-600" : "text-gray-500"}`}>{sub?.status || a.noSub}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{a.accountStatus}</span>
                    <span className={`font-semibold ${selected.active ? "text-green-600" : "text-red-600"}`}>{selected.active ? a.active : a.inactive}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{a.regDate}</span>
                    <span className="font-semibold">{new Date(selected.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "ar-SA")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => toggleActive(selected.id, selected.active)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${selected.active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
              >
                {selected.active ? a.deactivate : a.activate}
              </button>
              <button
                onClick={() => { setConfirmDelete(selected.id); setSelected(null); }}
                className="flex-1 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
              >
                {a.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-red-600 text-lg mb-2">{a.confirmDelete}</h3>
            <p className="text-sm text-gray-500 mb-4">{a.confirmDeleteMsg}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">{a.cancel}</button>
              <button onClick={() => deleteUser(confirmDelete)} className="flex-1 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-all">{a.deleteConfirm}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
