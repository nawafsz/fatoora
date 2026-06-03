"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

type Ticket = {
  id: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
};

export default function AdminTicketsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { dict, lang } = useLanguage();
  const s = dict.support;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/admin/tickets").then((r) => r.json()).then(setTickets);
  }, []);

  const toggleStatus = async (ticket: Ticket) => {
    const newStatus = ticket.status === "open" ? "closed" : "open";
    const res = await fetch(`/api/admin/tickets?id=${ticket.id}&status=${newStatus}`, { method: "PATCH" });
    if (res.ok) {
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status: newStatus } : t)));
      if (selected?.id === ticket.id) setSelected({ ...selected, status: newStatus });
    }
  };

  if (status === "loading") return <div className="text-center py-20 text-gray-400">{dict.common.loading}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir={lang === "en" ? "ltr" : "rtl"}>
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{s.adminTitle}</h1>
        <p className="text-gray-500 text-sm mt-1">{s.adminDesc || s.desc}</p>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <p className="text-gray-400 text-lg">{s.adminEmpty}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-right">
                <th className="px-5 py-3 text-xs font-bold text-gray-400">{s.subject}</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-400">{s.from}</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-400">{s.date}</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-400">{s.statusLabel}</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm font-semibold text-[#0d2818]">{ticket.subject}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{ticket.user.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{new Date(ticket.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "ar-SA")}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ticket.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {ticket.status === "open" ? s.status.open : s.status.closed}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => setSelected(ticket)} className="text-xs text-[#1a5632] font-bold hover:underline">{s.view}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full mx-4 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#0d2818]">{selected.subject}</h2>
                <p className="text-xs text-gray-400 mt-1">{s.from} {selected.user.name} &lt;{selected.user.email}&gt;</p>
                <p className="text-xs text-gray-400">{new Date(selected.createdAt).toLocaleString(lang === "en" ? "en-US" : "ar-SA")}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap mb-4">
              {selected.body}
            </div>
            <button
              onClick={() => toggleStatus(selected)}
              className={`w-full py-2 rounded-xl text-sm font-bold transition-all ${selected.status === "open" ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-[#1a5632] text-white hover:bg-[#2d8a4e]"}`}
            >
              {selected.status === "open" ? s.markClosed : s.markOpen}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
