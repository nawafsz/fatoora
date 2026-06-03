"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function ForgotPasswordPage() {
  const { dict, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? dict.common.error);
        return;
      }

      if (data.devLink && typeof window !== "undefined" && window.location.hostname === "localhost") {
        setResetLink(data.devLink);
      }
      setDone(true);
    } catch {
      setError(dict.common.networkError);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5632]/20 focus:border-[#1a5632] transition-all bg-gray-50 hover:bg-white";

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">✅</div>
          <h1 className="text-2xl font-black text-[#0d2818] mb-2">{dict.auth.forgotPassword.success}</h1>
          <p className="text-gray-500 text-sm mb-4">{dict.auth.forgotPassword.successMsg}</p>
          {resetLink && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left" dir="ltr">
              <p className="text-xs text-gray-400 mb-1">{dict.auth.forgotPassword.devLink}</p>
              <a href={resetLink} className="text-sm text-[#1a5632] font-semibold break-all hover:underline">{resetLink}</a>
            </div>
          )}
          <Link href="/auth/login" className="text-[#1a5632] font-bold text-sm hover:underline">{dict.auth.forgotPassword.backToLogin}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-[#1a5632]/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔐</div>
          <h1 className="text-2xl font-black text-[#0d2818]">{dict.auth.forgotPassword.heading}</h1>
          <p className="text-gray-500 text-sm mt-1">{dict.auth.forgotPassword.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#0d2818] mb-2">{dict.auth.forgotPassword.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="example@email.com"
              dir="ltr"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-3 text-center">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a5632] text-white py-3.5 rounded-2xl font-black text-sm hover:bg-[#2d8a4e] transition-all shadow-lg shadow-[#1a5632]/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                {dict.auth.forgotPassword.loading}
              </span>
            ) : dict.auth.forgotPassword.submit}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-400">
          {dict.auth.forgotPassword.remembered}{" "}
          <Link href="/auth/login" className="text-[#1a5632] font-bold hover:underline">{dict.auth.forgotPassword.login}</Link>
        </p>
      </div>
    </div>
  );
}
