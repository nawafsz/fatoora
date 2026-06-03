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
};

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { dict, lang } = useLanguage();
  const s = dict.support;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  const loadTickets = () => {
    fetch("/api/tickets").then((r) => r.json()).then(setTickets);
  };

  useEffect(() => {
    if (status === "authenticated") loadTickets();
  }, [status]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSuccess(true);
      setSubject("");
      setBody("");
      setShowForm(false);
      loadTickets();
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  if (status === "loading") return <div className="text-center py-20 text-gray-400">{dict.common.loading}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir={lang === "en" ? "ltr" : "rtl"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0d2818]">{s.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{s.desc}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#1a5632] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all shadow-sm"
        >
          {showForm ? dict.common.cancel : s.newTicket}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 text-sm font-bold">
          {s.success} {s.successDesc}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">{s.subject}</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={s.subjectPlaceholder}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632]"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">{s.body}</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={s.bodyPlaceholder}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] resize-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1a5632] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#2d8a4e] transition-all disabled:opacity-50"
          >
            {submitting ? s.submitting : s.submit}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-lg">{s.empty}</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-[#0d2818]">{ticket.subject}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${ticket.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {ticket.status === "open" ? s.status.open : s.status.closed}
                </span>
              </div>
              <p className="text-sm text-gray-500 whitespace-pre-wrap line-clamp-3">{ticket.body}</p>
              <p className="text-xs text-gray-400 mt-2">{new Date(ticket.createdAt).toLocaleString(lang === "en" ? "en-US" : "ar-SA")}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
